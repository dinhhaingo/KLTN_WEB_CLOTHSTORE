var express = require('express')
var cors = require('cors')
const bodyParser = require("body-parser");
var app = express()

module.exports = app => {
    const report = require("../controllers/report.controller.js");

    var router = require("express").Router();
    
    router.get('/count-all', report.countAll);

    router.get('/revenue-yearly', report.revenueYearly);

    router.get('/customer-orderd', report.customerOrderd);

    router.get('/type-product-ordered', report.typeProOrdered);

    app.use('/report', router);
}