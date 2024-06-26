const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/AddProduct')
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'carts'
  }

});
module.exports = mongoose.model('users', userSchema);
