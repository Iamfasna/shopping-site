var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  // let products = [
  //   {
  //     name: "MAC STUDIO FIX FOUNDATION",
  //     category: "foundation",
  //     description: "24 hrs matte finish",
  //     image: "https://sdcdn.io/mac/in/mac_sku_M6JC68_1x1_0.png?width=1440&height=1440"

  //   },
  //   {
  //     name: "MAC MACXIMAL MATTE LIPSTICK - Lippenstift",
  //     category: "lipstick",
  //     description: "24 hrs matte finish",
  //     image: "https://sdcdn.io/mac/in/mac_sku_M2LP70_1x1_0.png?width=1080&height=1080"

  //   },
  //   {
  //     name: "MAC MINERALIZE SKINFINISH - Highlighter",
  //     category: "Highlighter",
  //     description: "24 hrs matte finish",
  //     image: "https://sdcdn.io/mac/us/mac_sku_MT1334_1x1_0.png?width=1440&height=1440"

  //   },
  //   {
  //     name: "MAC CONNECT- IN - COLOUR EYESHADOW PALETTE ",
  //     category: "palette",
  //     description: "24 hrs matte finish",
  //     image: "https://www.sephora.com/productimages/sku/s2676344-main-zoom.jpg?imwidth=315"
  //   }

  // ]
  res.render('index', { products, admin: false });
});

module.exports = router;
