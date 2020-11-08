module.exports = app => {
    const product = require("../controllers/product.controller.js");

    var router = require("express").Router();

    // Create a new Tutorial
    router.post("/", product.create);

    // Retrieve all post
    router.get("/", product.findAll);

    // Retrieve all published post
    router.get("/published", product.findAllPublished);

    // Delete a Tutorial with id
    router.delete("/:id", product.delete);

    // Create a new Tutorial
    router.delete("/", product.deleteAll);

    app.use('/api/product', router);
};