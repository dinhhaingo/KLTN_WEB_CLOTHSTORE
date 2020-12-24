const express = require('express')
const cors = require('cors')
const bodyParser = require("body-parser");
const app = express()

const corsOptions1 = {
    origin: "http://192.168.0.101:4200",
    optionsSuccessStatus: 200
};

// app.use(cors(corsOptions1));

module.exports = app => {
    const product = require("../controllers/product.controller.js");

    var router = require("express").Router();

    router.post("/create", product.create);

    router.get("/get-all", product.getAll);

    router.put("/update-product", product.updateProduct);

    router.put("/update-image",product.updateImage);

    router.get("/get-product-discount",product.getProductDiscount);

    router.get("/get-product-random",product.getProductRandom);

    router.get("/get-all-client", product.getAllClient)
    
    router.get("/get-product-hot", product.getProductHot);

    router.get("/search-product", product.searchProduct);

    router.get("/get-by-id", product.getById);

    app.use('/product', router);
};