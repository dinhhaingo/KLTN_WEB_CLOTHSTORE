let express = require('express')
let cors = require('cors')
let app = express()

var corsOptions1 = {
    origin: "http://192.168.0.101:4200",
    optionsSuccessStatus: 200
};

// app.use(cors(corsOptions1));

module.exports = app => {
    const productType = require("../controllers/product_type.controller.js");

    let router = require('express').Router();

    router.get("/get-all", productType.getAll);

    app.use('/product-type', router);
}