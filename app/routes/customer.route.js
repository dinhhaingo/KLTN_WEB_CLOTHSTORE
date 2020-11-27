var express = require('express')
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();

var corsOptions = {
    origin: "http://192.168.0.104:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

module.exports = app => {
    const customer = require("../controllers/customer.controller.js");

    var router = require("express").Router();

    router.post("/create", customer.create);

    router.post("/register", customer.register);

    router.put("/verify-customer", customer.verifyCustomer);

    router.put("/update-profile", customer.updateProfile);

    router.put("/change-password", customer.changePassword)

    router.put("/forgot-passwor", customer.forgotPassword);

    router.get("/find-all", cors(corsOptions), customer.findAll);

    router.post("/login", customer.login);

    router.post("/refresh-token", customer.refreshToken);

    app.use('/customer', router);
};