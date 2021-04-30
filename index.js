const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {authorize} = require('./authenticateToken');
const validateSchema = require('./validateSchema');
const postsRouter = require('./controllers/posts');
const authRouter = require('./controllers/auth');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const Post = require('./models/post');
let path = require('path');

const app = express();
app.use('/images', express.static('images'));
morgan.token('body', (req, res) => JSON.stringify(req.body));
morgan.token('file', (req, res) => JSON.stringify(req.file));
morgan.token('res', (req, res) => JSON.stringify(res.file));
app.use(morgan(':method :status :body :res :file'));

app.use(cors());
//app.use(authorize);
app.use(bodyParser.json({limit: '50mb'}));
app.use(
  bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000})
);

var server = require('http').Server(app);
const socketio = require('socket.io');

// socket.io
io = socketio(server, {
  cors: {
    origin: '*',
  },
});
// now all request have access to io
app.use(function (req, res, next) {
  req.io = io;
  next();
});

mongoose
  .connect(
    'mongodb+srv://Nouman:bhatti@12345@testing.fevcr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    {useFindAndModify: false}
  )
  .then(() => {
    console.log('Connected to database');
  })
  .catch(err => console.log('Error connecting database', err.message));

app.use(validateSchema);

app.use('/auth', authRouter);

app.get('/posts', async (req, res) => {
  const posts = await Post.find({})
    .populate('user', userPopulatedFields)
    .populate('comments.user', userPopulatedFields);
  return res.json(posts.map(post => post.toJSON()));
});

app.get('/posts/singlePost/:id', async (req, res) => {
  //  const auth = req.user;
  //  if (auth) {
  let post = await Post.findById(req.params.id).populate('user','id name _id email').populate('comments.user','id name _id email');
  //if (post?.user?.toString() !== auth?.id?.toString())
  //  return res.status(401).send('Not authorized');
  post = post.toJSON();
  // req.io.emit("SINGLE_POST", post);
  return res.json(post);
  //  }
  //  return res.status(401).send('Not authorized');
});

app.use('/posts', authorize, postsRouter);

//app.use('/collections', collectionsRouter);

app.get('/', (req, res) => {
  res.json({success: true});
});

const userPopulatedFields = 'id _id email name';

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
