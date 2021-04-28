const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {type: String},
    firstName: {
      type: String,
      //  required: true,
    },
    lastName: {
      type: String,
      //  required: true,
    },
    address: {type: String},
    email: {type: String, required: true},
    password: {type: String},
  },
  {timestamps: true}
);

userSchema.set('toJSON', {
  transform: (doc, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject._v;
  },
});

module.exports = mongoose.model('User', userSchema);
