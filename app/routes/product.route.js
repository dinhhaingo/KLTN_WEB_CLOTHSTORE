const express = require('express')
const cors = require('cors')
const bodyParser = require("body-parser");
const app = express()

const corsOptions1 = {
    origin: "http://192.168.0.105:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions1));

module.exports = app => {
    const product = require("../controllers/product.controller.js");

    var router = require("express").Router();

    router.post("/create", cors(corsOptions1), product.create);

    router.get("/get-all", cors(corsOptions1), product.getAll);

    router.put("/update-product", cors(corsOptions1), product.updateProduct);

    router.put("/update-image", cors(corsOptions1), product.updateImage);

    router.get("/get-product-discount", cors(corsOptions1), product.getProductDiscount);

    router.get("/get-product-random", cors(corsOptions1), product.getProductRandom);

    router.get("/get-all-client", cors(corsOptions1), product.getAllClient)
    
    router.get("/get-product-hot", cors(corsOptions1), product.getProductHot);

    router.get("/search-product", cors(corsOptions1), product.searchProduct);

    router.get("/get-by-id", cors(corsOptions1), product.getById);

    app.use('/product', router);
};