const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  order: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'addproducts',
      required: true,
    },
    quantity: {
      type: Number,
      min: 1,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
  }],
  totalQuantity: {
    type: Number,
    min: 1,
    required: true,
  },
  status: {
    type: String,
    enum: [
      "Pending",
      "Ordered",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Returned",
      "Refunded",
    ],
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'address',
    required: true,
  },
  deliveryDate: {
    type: Date,
    default: function () {
      const oneWeekLater = new Date();
      oneWeekLater.setDate(oneWeekLater.getDate() + 7); // Add 7 days
      return oneWeekLater;
    }
  },
  razorpayOrderId: {
    type: String,
    required: false, // Set to false because it's only required for Razorpay orders
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Success', 'Failed'],
    default: 'Pending',
  },
});

module.exports = mongoose.model('Order', orderSchema);
