module.exports = app => {
    const employee = require("../controllers/employee.controller.js");

    var router = require("express").Router();

    router.post("/create", employee.create);

    router.get("/find-all", employee.findAll);

    router.get("/get-all", employee.findAll);

    router.put("/change-password", employee.changePassword);

    router.put("/update-profile", employee.updateProfile)

    router.put("/update-image", employee.updateImage);

    router.post("/login", employee.login);

    router.put("/refresh-token", employee.refreshToken);

    app.use('/employee', router);
};