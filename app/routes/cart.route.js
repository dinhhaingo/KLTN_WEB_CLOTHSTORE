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
    origin: "http://192.168.0.100:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions1));

module.exports = app => {
    const cart = require("../controllers/cart.controller.js");

    var router = require("express").Router();

    router.use(authMiddleware.isAuth);

    router.post("/insert-cart", cors(corsOptions1), cart.insertToCart);

    router.get("/get-by-customer", cors(corsOptions1), cart.getByCustomerId)

    router.put("/update-qty", cors(corsOptions1), cart.updateQty)

    router.delete("/delete-cart", cors(corsOptions1), cart.deletecart);

    app.use('/cart', router);
};