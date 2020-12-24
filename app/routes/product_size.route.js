let express = require('express')
let cors = require('cors')
let app = express()

module.exports = app => {
    const productSize = require("../controllers/product_size.controller.js");

    let router = require('express').Router();

    router.get("/get-all", productSize.getAll);

    router.get("/get-by-product-type", productSize.getByProductType);

    app.use('/product-size', router);
}