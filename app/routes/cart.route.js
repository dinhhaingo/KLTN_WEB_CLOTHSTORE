const express = require('express')
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();
const authMiddleware = require('../middleware/AuthMiddleware');

// var corsOptions = {
//     origin: "https://kltn-fe-admin.vercel.app",
//     optionsSuccessStatus: 200
// };
const corsOptions1 = {
    origin: "http://192.168.0.101:4200",
    optionsSuccessStatus: 200
};

// app.use(cors(corsOptions1));

module.exports = app => {
    const cart = require("../controllers/cart.controller.js");

    var router = require("express").Router();

    router.use(authMiddleware.isAuth);

    router.post("/insert-cart", cart.insertToCart);

    router.get("/get-by-customer", cart.getByCustomerId)

    router.put("/update-qty", cart.updateQty)

    router.delete("/delete-cart", cart.deletecart);

    router.post("/update-to-buy", cart.updateToBuying);

    app.use('/cart', router);
};