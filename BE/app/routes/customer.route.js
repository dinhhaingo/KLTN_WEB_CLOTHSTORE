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
    const customer = require("../controllers/customer.controller.js");

    var router = require("express").Router();

    router.post("/create", customer.create);

    router.post("/register", cors(corsOptions1), customer.register);

    router.post("/login", customer.login);

    router.put("/verify-customer", customer.verifyCustomer);

    router.put("/forgot-passwor", customer.forgotPassword);

    router.use(authMiddleware.isAuth);

    router.put("/update-profile", customer.updateProfile);

    router.get("/get-info", customer.getUserInfo)

    router.put("/change-password", customer.changePassword)

    router.get("/find-all", cors(corsOptions1), customer.findAll);

    router.post("/refresh-token", customer.refreshToken);

    app.use('/customer', router);
};