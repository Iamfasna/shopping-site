const express = require('express');
const router = express.Router();
const AddProduct = require('../connections/db');
const multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage })


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
