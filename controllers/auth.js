const authRouter = require('express').Router();
const Bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {authorize} = require('../authenticateToken');
const User = require('../models/user');
const {jwtSecret} = require('../utils/secret');

authRouter.post('/signup', async (req, res) => {
  req.validateSchema({
    type: 'object',
    additionalProperties: false,
    required: ['email', 'password', 'name'],
    properties: {
      firstName: {type: 'string'},
      lastName: {type: 'string'},
      name: {type: 'string'},
      address: {type: 'string'},
      email: {type: 'string'},
      password: {type: 'string'},
    },
  });
  const foundUser = await User.findOne({email: req.body.email});
  if (foundUser)
    return res.status(400).json({message: 'email already exists!'});
  req.body.password = Bcrypt.hashSync(req.body.password, 10);
  const user = new User(req.body);
  const result = await user.save();
  const response = result.toJSON();
  delete response.password;
  res.json(response);
});

authRouter.post('/login', async (req, res) => {
  req.validateSchema({
    type: 'object',
    additionalProperties: false,
    required: ['email', 'password'],
    properties: {
      email: {type: 'string'},
      password: {type: 'string'},
    },
  });
  const foundUser = await User.findOne({email: req.body.email});
  if (!foundUser) return res.status(400).json({message: 'email not found!'});
  const valid = await Bcrypt.compare(req.body.password, foundUser.password);
  console.log('valid', valid);
  if (!valid) return res.status(400).json({message: 'password is incorrect!'});
  const user = foundUser.toJSON();
  delete user.password;
  const token = jwt.sign(user, jwtSecret, {expiresIn: '24h'});
  res.json({token, user});
});

authRouter.get('/single', authorize, async (req, res) => {
  const foundUser = await User.findById(req.user.id);
  const user = foundUser.toJSON();
  return res.json(user);
});

module.exports = authRouter;
