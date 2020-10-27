module.exports = app => {
    const post = require("../controllers/product.controller.js");

    var router = require("express").Router();

    // Create a new Tutorial
    router.post("/", post.create);

    // Retrieve all post
    router.get("/", post.findAll);

    // Retrieve all published post
    router.get("/published", post.findAllPublished);

    // Retrieve a single Tutorial with id
    router.get("/:id", post.findOne);

    // Update a Tutorial with id
    router.put("/:id", post.update);

    // Delete a Tutorial with id
    router.delete("/:id", post.delete);

    // Create a new Tutorial
    router.delete("/", post.deleteAll);

    app.use('/api/product', router);
};