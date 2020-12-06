var express = require('express')
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();

// var corsOptions = {
//     origin: "https://kltn-fe-admin.vercel.app",
//     optionsSuccessStatus: 200
// };
var corsOptions1 = {
    origin: "http://192.168.0.100:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions1));

module.exports = app => {
    const employee = require("../controllers/employee.controller.js");

    var router = require("express").Router();

    router.post("/create", employee.create);

    router.get("/find-all", employee.findAll);

    router.get("/get-all", employee.getAll);

    router.put("/change-password", employee.changePassword);

    router.put("/update-profile", employee.updateProfile)

    router.put("/update-image", employee.updateImage);

    router.post("/login", cors(corsOptions1), employee.login);

    router.post("/refresh-token", employee.refreshToken);

    app.use('/employee', router);
};