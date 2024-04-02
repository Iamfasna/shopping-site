var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const AddProduct = require('../connections/db');
const users = require('../connections/userdetails');

/* GET home page. */
router.get('/', async (req, res) => {
  try {
    const products = await AddProduct.find({}).lean();
    res.render('user/index', { products, admin: false });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

/*Login page */

router.get('/login', (req, res) => {
  res.render('user/login')
})

/* signup  form */
router.get('/signup', (req, res) => {
  res.render('user/signup')
})

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

    // Check if a user with the provided email exists
    const user = await users.findOne({ email: email });

    if (!user) {
      // User not found, redirect to signup
      return res.redirect('/signup');
    }

    const passwordkey = req.body.password;

    // User found, compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password Match:', passwordMatch);

    if (!passwordMatch) {
      // Passwords don't match, redirect to signup
      console.log('Passwords do not match');
      return res.redirect('/signup');
    }

    // Passwords match, consider the user logged in
    console.log('Login successful!');
    req.session.user = user;
    res.redirect('/')

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = router;
