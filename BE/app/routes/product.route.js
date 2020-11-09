var express = require('express')
var cors = require('cors')
var app = express()

// app.use(cors());

module.exports = app => {
    const product = require("../controllers/product.controller.js");

    var router = require("express").Router();

    router.post("/create", cors(), product.create);

    router.get("/find-all", cors(), product.findAll);

    router.get("/get-all", cors(), product.getAll);

    router.put("/update-product", cors(), product.updateProduct);

    router.put("/update-image", cors(), product.updateImage);

    app.use('/product', router);
};