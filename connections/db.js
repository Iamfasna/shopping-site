const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/AddProduct')
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true

  },
  price: {
    type: Number,
    required: true

  },
  description: {
    type: String,
    required: true

  },
  imageUrl: {
    data: Buffer,
    contentType: String
  }
});

module.exports = mongoose.model('addproducts', productSchema);
