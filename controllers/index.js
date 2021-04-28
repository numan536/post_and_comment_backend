
const Router = require('express').Router();
const posts = require('./posts')



// guaranteed to get dependencies
const controllers= () => {
	const app = Router();
	posts(app);

	return app;
};
postsRouter.get('/singlePost/:id', async (req, res) => {
	//  const auth = req.user;
	//  if (auth) {
	let post = await Post.findById(req.params.id);
	//if (post?.user?.toString() !== auth?.id?.toString())
	//  return res.status(401).send('Not authorized');
	post = post.toJSON();
	// req.io.emit("SINGLE_POST", post);
	return res.json(post);
	//  }
	//  return res.status(401).send('Not authorized');
  });


module.exports = controllers;