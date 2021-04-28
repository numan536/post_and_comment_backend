const jwt = require('jsonwebtoken');
const {jwtSecret} = require('./utils/secret');
async function authorize(req, res, next) {
  const header = req.hearers?.authorization;
  if (
    header != 'Bearer null' &&
    req.headers?.authorization?.startsWith('Bearer ')
  ) {
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
      const decodedToken = jwt.verify(idToken, jwtSecret);
      console.log({decodedToken});
      if (!decodedToken) throw new Error('you are unauthorized!');
      req['user'] = decodedToken;
      next();
    } catch (e) {
      console.log(e);
      return res.status(401).json({message: 'you are unauthorized!'});
    }
  } else {
    return res.status(401).json({message: 'you are unauthorized!'});
  }
}

module.exports = {authorize};
