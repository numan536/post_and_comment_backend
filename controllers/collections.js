const collectionsRouter = require('express').Router();
const Collection = require('../models/collection');
const {firebaseAdmin} = require('../authenticateToken');
const {v4: uuidv4} = require('uuid');
let path = require('path');

collectionsRouter.get('/', async (req, res) => {
  const auth = req.currentUser;
  if (auth) {
    const collections = await Collection.find({});

    req.io.emit('UPDATE', collections);
    return res.json(collections.map(post => post.toJSON()));
  }
  return res.status(401).send('Not authorized');
});

collectionsRouter.post('/create', async (req, res) => {
  const auth = req.currentUser;
  if (auth) {
    const collection = new Collection({
      title: req.body.title,
      posts: req.body.posts,
      user: auth.email,
    });
    const savedPost = collection.save();
  }
  return res.status(401).send('Not authorized');
});

collectionsRouter.get('/collectionsByUser', async (req, res) => {
  const auth = req.currentUser;
  if (auth) {
    const posts = await Collection.find({user: auth.email}).populate('posts');

    return res.json(posts.map(post => post.toJSON()));
  }
  return res.status(401).send('Not authorized');
});

collectionsRouter.get('/collectionsByUser/:email', async (req, res) => {
  const auth = req.currentUser;
  const {email} = req.params;
  if (auth) {
    const posts = await Collection.find({user: email}).populate('posts');

    // req.io.emit("UPDATE", posts);
    return res.json(posts.map(post => post.toJSON()));
  }
  return res.status(401).send('Not authorized');
});

collectionsRouter.post('/addPostToCollection', async (req, res) => {
  const auth = req.currentUser;
  if (auth) {
    let collection;
    if (req.body.collectionId) {
      collection = await Collection.findById(req.body.collectionId);
    } else {
      const collections = await Collection.find({user: auth.email});
      if (!collections[0])
        return res.status(400).json({message: 'collection does not exists'});
      collection = collections[0];
      console.log({collection});
    }

    collection.posts = !collection.posts.includes(req.body.postId)
      ? collection.posts.concat(req.body.postId)
      : collection.posts;
    await collection.save();

    // req.io.emit("UPDATE", posts);
    return res.json(collection);
  }
  return res.status(401).send('Not authorized');
});

collectionsRouter.post('/removePostFromCollection', async (req, res) => {
  const auth = req.currentUser;
  if (auth) {
    let collection;
    if (req.body.collectionId) {
      collection = await Collection.findById(req.body.collectionId);
    } else {
      const collections = await Collection.find({user: auth.email});
      collection = collections[0];
      if (!collection)
        return res.status(400).json({message: 'collection does not exists'});
      console.log({collection});
    }
    console.log(
      'collection.posts',
      collection.posts.filter(post => post.toString() !== req.body.postId)
    );
    console.log('body', req.body);
    collection.posts = collection.posts.filter(
      post => post.toString() !== req.body.postId
    );
    await collection.save();

    // req.io.emit("UPDATE", posts);
    return res.json(collection);
  }
  return res.status(401).send('Not authorized');
});

collectionsRouter.post('/getSingleCollection', async (req, res) => {
  const auth = req.currentUser;
  if (auth) {
    const collection = await Collection.findById(req.body.collectionId);

    // req.io.emit("UPDATE", posts);
    return res.json(collection);
  }
  return res.status(401).send('Not authorized');
});

collectionsRouter.post('/updateCollection', async (req, res) => {
  const auth = req.currentUser;
  if (auth) {
    const collection = await Collection.findById(req.body.collectionId);
    collection.title = req.body.title;
    await collection.save();

    // req.io.emit("UPDATE", posts);
    return res.json(collection);
  }
  return res.status(401).send('Not authorized');
});

collectionsRouter.post('/deleteCollection', async (req, res) => {
  const auth = req.currentUser;
  if (auth) {
    const collection = await Collection.findById(req.body.collectionId);
    if (collection) await Collection.findByIdAndRemove(req.body.collectionId);

    // req.io.emit("UPDATE", posts);
    return res.json(collection);
  }
  return res.status(401).send('Not authorized');
});

module.exports = collectionsRouter;
