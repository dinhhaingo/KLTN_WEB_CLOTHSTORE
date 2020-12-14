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
    origin: "http://192.168.0.103:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions1));

module.exports = app => {
    const rating = require("../controllers/product_rating.controller.js");

    var router = require("express").Router();

    router.get('/get-by-product', cors(corsOptions1), rating.getByProductId);

    router.use(authMiddleware.isAuth);

    router.post("/rate-by-customer", cors(corsOptions1), rating.rateByCustomer);

    app.use('/rating', router);
};