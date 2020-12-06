var express = require('express')
var cors = require('cors')
const bodyParser = require("body-parser");
var app = express()

var corsOptions1 = {
    origin: "http://192.168.0.100:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions1));

module.exports = app => {
    const province = require("../controllers/province.controller.js");

    var router = require("express").Router();

    // router.post("/create", cors(corsOptions1), province.create);

    router.get("/get-district", cors(corsOptions1), province.getDistrictByProvince);

    router.get("/get-all", cors(corsOptions1), province.getAllProvince);

    router.get("/get-ward", cors(corsOptions1), province.getWardByDistrict);

    // router.put("/update-product", cors(corsOptions1), province.updateProduct);

    // router.put("/update-image", cors(corsOptions1), province.updateImage);

    app.use('/province', router);
};