let express = require('express')
let cors = require('cors')
let app = express()

module.exports = app => {
    const productType = require("../controllers/product_type.controller.js");

    let router = require('express').Router();

    router.get("/get-all", cors(), productType.getAll);

    app.use('/product-type', router);
}