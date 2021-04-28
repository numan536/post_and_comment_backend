
const Router = require('express').Router();
const posts = require('./posts')



// guaranteed to get dependencies
const controllers= () => {
	const app = Router();
	posts(app);

	return app;
};


module.exports = controllers;