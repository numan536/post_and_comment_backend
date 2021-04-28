const Ajv = require('ajv');

module.exports = (req, res, next) => {
  console.log('here it comes to middleware', req.method);
  const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
  if (req.method !== 'GET') {
    req.validateSchema = function (schema, data = req.body) {
      const validate = ajv.compile(schema);
      const valid = validate(data);
      if (!valid) {
        return res.status(422).json(validate.errors);
      } else {
        return {valid, errors: validate.errors};
      }
    };
    next();
  } else {
    next();
  }
};
