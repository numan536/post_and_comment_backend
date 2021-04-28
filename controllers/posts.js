const postsRouter = require('express').Router();
const Post = require('../models/post');
const multer = require('multer');
const {firebaseAdmin} = require('../authenticateToken');
const {v4: uuidv4} = require('uuid');
let path = require('path');

const userPopulatedFields = 'id _id email name';

//postsRouter.get('/', async (req, res) => {
//  const auth = req.user;
//  if (auth) {
//    const posts = await Post.find({})
//      .populate('user', userPopulatedFields)
//      .populate('comments.user', userPopulatedFields);
//    return res.json(posts.map(post => post.toJSON()));
//  }
//  return res.status(401).send('Not authorized');
//});

postsRouter.get('/postsByUser/:id', async (req, res) => {
  const auth = req.user;
  const {id} = req.params;
  if (auth) {
    const posts = await Post.find({user: id}).populate(
      'user',
      userPopulatedFields
    );

    // req.io.emit("UPDATE", posts);
    return res.json(posts.map(post => post.toJSON()));
  }
  return res.status(401).send('Not authorized');
});

postsRouter.get('/postsByLike', async (req, res) => {
  const auth = req.user;
  if (auth) {
    const posts = await Post.find({likes: {$in: [auth.id]}}).populate(
      'user',
      userPopulatedFields
    );

    req.io.emit('UPDATE', posts);
    return res.json(posts.map(post => post.toJSON()));
  }
  return res.status(401).send('Not authorized');
});

postsRouter.get('/userById/:id', async (req, res) => {
  const auth = req.user;
  const {id} = req.params;

  if (auth) {
    if (auth.id === id) return res.json(auth);
    const user = await firebaseAdmin.auth().getUserByEmail(email);
    return res.json(user);
  }
  return res.status(401).send('Not authorized');
});

postsRouter.get('/postsByUser', async (req, res) => {
  const auth = req.user;
  if (auth) {
    const posts = await Post.find({user: auth.id}).populate(
      'user',
      userPopulatedFields
    );

    req.io.emit('UPDATE', posts);
    return res.json(posts.map(post => post.toJSON()));
  }
  return res.status(401).send('Not authorized');
});

postsRouter.get('/singlePost/:id', async (req, res) => {
  const auth = req.user;
  if (auth) {
    let post = await Post.findById(req.params.id);
    if (post?.user?.toString() !== auth?.id?.toString())
      return res.status(401).send('Not authorized');
    post = post.toJSON();
    // req.io.emit("SINGLE_POST", post);
    return res.json(post);
  }
  return res.status(401).send('Not authorized');
});

postsRouter.post('/updatePost', async (req, res) => {
  const auth = req.user;
  if (auth) {
    const post = await Post.findById(req.body.postId);
    if (!post) return res.status(400).json({message: 'post not found'});
    if (post.user?.toString() !== auth.id?.toString())
      return res.status(401).json({message: 'you are unauthorized!'});
    post.title = req.body.title;
    post.img = req.body.image;
    post.description = req.body.description;
    await post.save();

    let updatedPost = await Post.findById(req.body.postId)
      .populate('user', userPopulatedFields)
      .populate('comments.user', userPopulatedFields);
    updatedPost = updatedPost.toJSON();
    // req.io.emit("UPDATE", posts);
    req.io.emit('SINGLE_POST', updatedPost);

    // req.io.emit("UPDATE", posts);
    return res.json(updatedPost);
  }
  return res.status(401).send('Not authorized');
});

postsRouter.post('/delete/:id', async (req, res) => {
  const auth = req.user;
  if (auth) {
    const {id} = req.params;
    const post = await Post.findById(id);
    if (post) await Post.findByIdAndRemove(id);

    // req.io.emit("UPDATE", posts);
    return res.json(post);
  }
  return res.status(401).send('Not authorized');
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '-' + Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

let upload = multer({storage, fileFilter});

postsRouter.route('/').post(async (req, res) => {
  const auth = req.user;
  if (auth) {
    const post = new Post({
      title: req.body.title,
      img: req.body.img || '',
      description: req.body.description || '',
      tags: [],
      likes: [],
      comments: [],
      user: req.user.id,
    });
    const savedPost = post.save();
    const posts = await Post.find({});
    req.io.emit('UPDATE', posts);
    return res.status(201).json(savedPost);
  }
  return res.status(401).send('Not authorized');
});

postsRouter.post('/like', async (req, res) => {
  const auth = req.user;
  if (auth) {
    try {
      const post = await Post.findById(req.body.id);
      const {like} = req.body;
      console.log(req.body);
      post.likes = post.likes
        ? like
          ? post.likes.concat(req.user.id)
          : post.likes.filter(item => item !== req.user.id)
        : [{user: req.user.email, content: req.body.content}];
      const saved = post.save();
      let updatedPost = await Post.findById(req.body.id);
      updatedPost = {
        ...updatedPost,
        comments: updatedPost.comments
          ? await Promise.all(
              updatedPost.comments.map(async comment => {
                const userWhoCommeted = await firebaseAdmin
                  .auth()
                  .getUserByEmail(req.user.id);
                return {
                  ...comment,
                  userName: userWhoCommeted.displayName,
                };
              })
            )
          : [],
      };
      // req.io.emit("UPDATE", posts);
      req.io.emit('SINGLE_POST', post);
      return res.status(201).json(post);
    } catch (e) {
      console.log(e);
    }
  }
  return res.status(500).send('Error server');
});

postsRouter.post('/comment', async (req, res) => {
  const auth = req.user;
  if (auth) {
    try {
      const post = await Post.findById(req.body.id);
      if (!post) return res.status(400).json({message: 'post not found!'});
      post.comments = post.comments
        ? post.comments.concat({
            user: req.user.id,
            content: req.body.content,
          })
        : [{user: req.user.id, content: req.body.content}];
      // post.comments = req.body.comments;
      const saved = await post.save();
      let updatedPost = await Post.findById(req.body.id)
        .populate('user', userPopulatedFields)
        .populate('comments.user', userPopulatedFields);
      updatedPost = updatedPost.toJSON();
      // req.io.emit("UPDATE", posts);
      req.io.emit('SINGLE_POST', updatedPost);
      return res.status(201).json(saved);
    } catch (e) {
      console.log(e);
    }
  }
  return res.status(500).send('Error server');
});

postsRouter.post('/comment/delete', async (req, res) => {
  const auth = req.user;
  if (auth) {
    try {
      const post = await Post.findById(req.body.postId);
      if (!post) return res.status(400).json({message: 'post not found!'});
      post.comments = post.comments
        ? post.comments.filter(
            comment =>
              comment._id?.toString() !== req.body.commentId?.toString()
          )
        : [];
      // post.comments = req.body.comments;
      const saved = await post.save();
      let updatedPost = await Post.findById(req.body.postId)
        .populate('user', userPopulatedFields)
        .populate('comments.user', userPopulatedFields);
      updatedPost = updatedPost.toJSON();
      // req.io.emit("UPDATE", posts);
      req.io.emit('SINGLE_POST', updatedPost);
      return res.status(201).json(saved);
    } catch (e) {
      console.log(e);
    }
  }
  return res.status(500).send('Error server');
});

module.exports = postsRouter;
