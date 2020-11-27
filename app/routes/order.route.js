var express = require('express')
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();
const authMiddleware = require('../middleware/AuthMiddleware');

var corsOptions = {
    origin: "http://192.168.0.104:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

module.exports = app => {
    const order = require("../controllers/order.controller.js");

    var router = require("express").Router();

    router.use(authMiddleware.isAuth);

    router.post("/insert-sale-order", order.insertSaleOrder);

    router.get("/get-all", order.getAll);

    router.put("/get-by-customer", order.getByCustomer);

    app.use('/order', router);
};