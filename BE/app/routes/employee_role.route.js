let express = require('express')
let cors = require('cors')
let app = express()

module.exports = app => {
    const employeeRole = require("../controllers/employee_role.controller.js");

    let router = require('express').Router();

    router.get("/get-all", cors(), employeeRole.getAll);

    app.use('/role', router);
}