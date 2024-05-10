const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const AddProduct = require('../connections/db');
const users = require('../connections/userdetails');
const Cart = require('../connections/cart')
const Address = require('../connections/address')
const OrderPlaced = require('../connections/orderplaced')
const mongoose = require('mongoose');
const Razorpay = require('razorpay');


// Middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    // User is logged in, proceed to the next middleware
    next();
  } else {
    // User is not logged in, redirect to login page or handle accordingly
    res.redirect('/login');
  }
};



/* GET home page. */
router.get('/', async (req, res) => {
  try {
    const products = await AddProduct.find({}).lean();
    res.render('user/index', { products, admin: false, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

/* Login page */
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/');
  } else
    res.render('user/login');

});


/* Signup form */
router.get('/signup', (req, res) => {
  res.render('user/signup');
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Generate a salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with hashed password
    const newUser = new users({
      name: name,
      email: email,
      password: hashedPassword
    });

    // Save the new user to the database
    await newUser.save();

    // Assign the user to the session
    req.session.user = newUser;

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if a user is already logged in
    if (req.session.user) {
      // User is already logged in, redirect to the home page
      return res.redirect('/');
    }

    // Check if a user with the provided email exists
    const user = await users.findOne({ email: email });
    if (!user) {
      // User not found, redirect to signup
      return res.redirect('/signup');
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      // Passwords don't match, redirect to login with an alert
      return res.render('user/login', { alertMessage: 'Incorrect email or password.' });
    }

    // Passwords match, consider the user logged in
    console.log('Login successful!');
    req.session.user = user;

    // Optionally, set a cookie to remember the user
    res.cookie('user_id', user._id, { maxAge: 900000, httpOnly: true });

    // Redirect to the home page or any other desired page
    return res.redirect('/');

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/logout', (req, res) => {
  try {
    // Destroy the session
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Clear any cookies you've set
      res.clearCookie('user_id');

      // Redirect to the home page after logout
      res.redirect('/');
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/add-cart', isLoggedIn, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req?.session?.user._id;
    // Check if the user already has a cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // If the user doesn't have a cart, create a new one
      cart = new Cart({
        userId,
        items: [{ productId, quantity }],
        totalQuantity: parseInt(quantity, 10),
        totalPrice: 0
      });
    } else {
      // If the user already has a cart, update the existing cart
      const existingProductIndex = cart.items.findIndex(item => item.productId.toString() === productId);
      if (existingProductIndex !== -1) {
        // If the product already exists in the cart, update its quantity
        cart.items[existingProductIndex].quantity += parseInt(quantity, 10);
      } else {
        // If the product is not in the cart, add it
        cart.items.push({ productId, quantity: parseInt(quantity, 10) });
      }
      // Update total quantity in the cart
      cart.totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
    }

    // Save the cart to the database
    await cart.save();

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/get-cart', isLoggedIn, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Redirect to the cart page and pass the cart details
    res.render('user/cart', { cartItems: cart.items, totalItems: cart.totalQuantity, totalPrice: cart.totalPrice });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.get('/cart', isLoggedIn, async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      // If user is not logged in, redirect to login page or handle accordingly
      return res.redirect('/login');
    }

    const userId = req.session.user._id;
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      console.log('Cart not found for user');
      return res.render('user/cart', { cartItems: [], totalItems: 0, totalPrice: 0 });
    }

    // Calculate total items
    const totalItems = cart.totalQuantity;

    // Calculate total price
    let totalPrice = 0;
    cart.items.forEach(item => {
      totalPrice += item.productId.price * item.quantity;
    });

    // Extract product details from populated items
    const cartItems = cart.items.map(item => ({
      productId: {
        id: item.productId._id,
        name: item.productId.name,
        imageUrl: item.productId.imageUrl,
        price: item.productId.price
      },
      quantity: item.quantity
    }));

    // Render the cart page with cart details
    res.render('user/cart', { totalItems, totalPrice, user: req.session.user, cartItems });
  } catch (error) {
    console.error('Error fetching cart details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route handler to handle item deletion from cart
router.get('/delete-item/:productId', isLoggedIn, async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.session.user._id;

    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    // Find the index of the item to be deleted
    const itemIndex = cart.items.findIndex(items => items.productId._id.toString() === productId);


    if (itemIndex === -1) {
      // If the item to delete is not found in the cart, handle accordingly
      return res.status(404).send('Item not found in the cart.');
    }

    // Get the item to be deleted
    const itemToDelete = cart.items[itemIndex];

    // Calculate the price of the item to be deleted
    const itemPrice = itemToDelete.productId.price * itemToDelete.quantity;

    // Remove the item from the cart's items array
    cart.items.splice(itemIndex, 1);

    // Update total quantity and total price
    cart.totalQuantity -= itemToDelete.quantity;
    cart.totalPrice -= itemPrice;

    // Save the updated cart
    await cart.save();

    res.redirect('/cart');
  } catch (error) {
    console.error('Error deleting item from cart:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/address', isLoggedIn, (req, res) => {

  res.render('user/address', { user: req.session.user, admin: false });
});
router.post('/address-add', isLoggedIn, async (req, res) => {
  try {
    const newAddress = new Address({
      userId: req.session.user._id, // Assuming you have access to the user's ID in the session
      name: req.body.name,
      address: req.body.address,
      state: req.body.state,
      district: req.body.district,
      pincode: req.body.pincode,
      phone: req.body.phone
    });
    await newAddress.save();

    res.redirect('/payment');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/payment', isLoggedIn, (req, res) => {

  res.render('user/payment', { user: req.session.user, admin: false });
});


const razorpay = new Razorpay({
  key_id: 'rzp_test_8pxmyTVmtiBZ9Y',
  key_secret: 'YS8UdUKIPVonnmtDV8FQUIXqz'
});

router.post('/orderplaced', isLoggedIn, async (req, res) => {
  try {
    const userId = req.session.user._id;
    console.log("User ID:", userId);

    const paymentMethod = req.body.paymentMethod;

    // Fetch the cart details for the user
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    console.log("Cart:", cart);

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const userAddress = await Address.findOne({ userId });
    console.log("User Address:", userAddress);

    if (!userAddress) {
      return res.status(404).json({ error: 'Address not found for the user' });
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const products = cart.items.map(item => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price,
    }));

    if (paymentMethod === 'cash on delivery') {
      const newOrder = new OrderPlaced({
        userId: userId,
        order: products,
        totalQuantity: cart.totalQuantity,
        status: 'Ordered',
        paymentMethod: 'cash on delivery',
        address: userAddress,
        deliveryDate: deliveryDate
      });

      const savedOrder = await newOrder.save();

      await Cart.findOneAndDelete({ userId });

      const orderId = savedOrder._id;

      res.render('user/orderplaced', { user: req.session.user, admin: false, orderId: orderId, deliveryDate: deliveryDate });

    } else if (paymentMethod === 'Razorpay') {
      const options = {
        amount: cart.totalAmount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: 'order_receipt_' + Date.now(),
        payment_capture: 1, // Capture payment immediately
        payment_method: 'upi', // Specify UPI as payment method
      };

      // Create a Razorpay order asynchronously
      const razorpayOrder = await new Promise((resolve, reject) => {
        razorpayInstance.orders.create(options, (error, order) => {
          if (error) {
            console.error('Error creating Razorpay order:', error);
            reject(error);
          } else {
            resolve(order);
          }
        });
      });

      const newOrder = new OrderPlaced({
        userId: userId,
        order: products,
        totalQuantity: cart.totalQuantity,
        status: 'Ordered',
        paymentMethod: 'Razorpay',
        address: userAddress,
        deliveryDate: deliveryDate,
        razorpayOrderId: razorpayOrder.id
      });

      const savedOrder = await newOrder.save();

      await Cart.findOneAndDelete({ userId });

      const orderId = savedOrder._id;

      // Redirect to the Razorpay checkout page with the order details
      res.redirect('user/orderplaced', { user: req.session.user, admin: false, orderId: orderId, deliveryDate: deliveryDate });
    }
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

router.get('/orderplaced', isLoggedIn, (req, res) => {
  const orderId = req.query.orderId;
  const deliveryDate = req.query.deliveryDate;

  // Render the order placed page with order ID, delivery date, and status
  res.render('user/orderplaced', { user: req.session.user, admin: false, orderId, deliveryDate });
});

module.exports = router;
