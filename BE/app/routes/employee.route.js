var express = require('express')
const cors = require("cors");

const app = express();

var corsOptions = {
    origin: "http://192.168.0.104:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

module.exports = app => {
    const employee = require("../controllers/employee.controller.js");

    var router = require("express").Router();

    router.post("/create", employee.create);

    router.get("/find-all", employee.findAll);

    router.get("/get-all", employee.findAll);

    router.put("/change-password", employee.changePassword);

    router.put("/update-profile", employee.updateProfile)

    router.put("/update-image", employee.updateImage);

    router.post("/login", cors(corsOptions), employee.login);

    router.put("/refresh-token", employee.refreshToken);

    app.use('/employee', router);
};