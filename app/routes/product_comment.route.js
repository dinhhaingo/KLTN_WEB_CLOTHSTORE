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

app.use(cors(corsOptions1));

module.exports = app => {
    const comment = require("../controllers/product_comment.controller.js");

    var router = require("express").Router();

    router.get("/get-by-product", cors(corsOptions1), comment.getByProductId);

    router.use(authMiddleware.isAuth);

    router.post("/comment-by-customer", cors(corsOptions1), comment.commentByCustomer);

    app.use('/comment', router);
};