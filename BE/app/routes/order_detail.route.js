var express = require('express')
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();
const authMiddleware = require('../middleware/AuthMiddleware');

var corsOptions1 = {
    origin: "http://192.168.0.103:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions1));

module.exports = app => {
    const order = require("../controllers/order_detail.controller.js");

    var router = require("express").Router();

    router.use(authMiddleware.isAuth);

    router.get("/get-by-order", order.getByOrderId);

    app.use('/order-detail', router);
};