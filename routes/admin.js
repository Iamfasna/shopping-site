const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const AddProduct = require('../connections/db');
const multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage })
const admin = require('../connections/adminlogin')

// Define the signup route
router.post('/adminsignup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Generate a salt and hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin with hashed password
    const newAdmin = new admin({
      name: name,
      email: email,
      password: hashedPassword
    });

    // Save the new admin to the database
    await newAdmin.save();

    // Assign the admin to the session
    req.session.admin = newAdmin;

    res.redirect('/view-products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Login route
router.post('/adminlogin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if a user with the provided email exists
    const foundAdmin = await admin.findOne({ email: email });
    if (!foundAdmin) {
      return res.redirect('/signup'); // Redirect to signup if admin not found
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, foundAdmin.password);

    if (!passwordMatch) {
      return res.render('admin/adminlogin', { alertMessage: 'Incorrect email or password.' });
    }

    // Admin authenticated, set session and cookie
    console.log('Login successful!');
    req.session.admin = foundAdmin;

    // Optionally, set a cookie to remember the admin
    res.cookie('admin_id', foundAdmin._id, { maxAge: 900000, httpOnly: true });

    res.redirect('/view-products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Logout route
router.get('/logout', (req, res) => {
  try {
    // Destroy the session
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Clear any cookies
      res.clearCookie('admin_id');

      res.redirect('/');
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).send('Internal Server Error');
  }
});
/* GET products listing. */
router.get('/view-products', async (req, res, next) => {
  try {
    const products = await AddProduct.find({}).lean();
    res.render('admin/view-products', { products: products, admin: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


/* GET add product form. */
router.get('/add-products', (req, res) => {
  res.render('admin/add-products', { admin: true });
});

/* POST add product form submission. */
router.post('/add-products', upload.single('image'), async (req, res) => {
  try {
    var newProduct = new AddProduct({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      description: req.body.description,
      imageUrl: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      }
    });
    // Save the new product to the database
    await newProduct.save();
    res.redirect('/admin/view-products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/delete', (req, res) => {
  const productId = req.body.productId;
  console.log('Received productId:', productId); // Log productId for debugging

  AddProduct.deleteOne({ _id: productId })
    .then(() => {
      res.redirect('/admin/view-products')
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal server error')
    });
});

router.get('/edit/:_id', async (req, res) => {

  const productId = req.params._id;
  const product = await AddProduct.findById(productId).lean();
  res.render('admin/edit-products', { product, admin: true });

});
/* POST edit product form submission. */
router.post('/edit/:_id', upload.single('image'), async (req, res) => {
  const productId = req.params._id;
  try {
    let updatedProduct = {
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      description: req.body.description,
    };

    if (req.file) {
      updatedProduct.imageUrl = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    await AddProduct.findByIdAndUpdate(productId, updatedProduct);
    res.redirect('/admin/view-products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
