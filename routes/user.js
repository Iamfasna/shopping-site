var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  let products = [
    {
      name: "MAC STUDIO FIX FOUNDATION",
      category: "foundation",
      description: "24 hrs matte finish",
      Image: ""

    },
    {
      name: "MAC MACXIMAL MATTE LIPSTICK - Lippenstift",
      category: "lipstick",
      description: "24 hrs matte finish",
      Image: ""

    },
    {
      name: "MAC MINERALIZE SKINFINISH - Highlighter",
      category: "Highlighter",
      description: "24 hrs matte finish",
      image: ""

    },
    {
      name: "MAC CONNECT- IN - COLOUR EYESHADOW PALETTE ",
      category: "palette",
      description: "24 hrs matte finish",
      image: ""
    }

  ]
  res.render('index', { products, admin: false });
});

module.exports = router;
