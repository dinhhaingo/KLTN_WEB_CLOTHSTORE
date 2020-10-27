const db = require("../models/index");
const PRODUCT = db.product;

// Create and Save a new Tutorial
exports.create = (req, res) => {
    // Validate request
    if (!req.body.product_name) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    // Create a Tutorial
    const product = new PRODUCT({
        product_id: db.autoIncrement.getNextSequence('product'),
        product_name: req.body.product_name,
        product_qty: req.body.product_qty,
        product_type_fk: req.body.product_type_fk,
        product_size_fk: req.body.product_size_fk,
        product_unit_price: req.body.product_unit_price,
        product_paid_price: req.body.product_paid_price,
        product_discount: req.body.product_discount,
        product_description: req.body.product_description,
        product_image1: req.body.product_image1,
        product_image2: req.body.product_image2,
        product_status: req.body.product_status
    });
    // Save Tutorial in the database
    product
        .save(product)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Tutorial."
            });
        });
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    const product_id = req.query.product_id;
    var condition = product_id ? { product_id: { $regex: new RegExp(product_id), $options: "i" } } : {};

    PRODUCT.find(condition)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving tutorials."
            });
        });
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
    const id = req.params.product_id;

    PRODUCT.findById(id)
        .then(data => {
            if (!data)
                res.status(404).send({ message: "Not found Tutorial with id " + id });
            else res.send(data);
        })
        .catch(err => {
            res
                .status(500)
                .send({ message: "Error retrieving Tutorial with id=" + id });
        });
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }

    const id = req.params.product_id;

    PRODUCT.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
        .then(data => {
            if (!data) {
                res.status(404).send({
                    message: `Cannot update PRODUCT with id=${id}. Maybe PRODUCT was not found!`
                });
            } else res.send({ message: "PRODUCT was updated successfully." });
        })
        .catch(err => {
            res.status(500).send({
                message: "Error updating PRODUCT with id=" + id
            });
        });
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.product_id;

    PRODUCT.findByIdAndRemove(id)
        .then(data => {
            if (!data) {
                res.status(404).send({
                    message: `Cannot delete PRODUCT with id=${id}. Maybe PRODUCT was not found!`
                });
            } else {
                res.send({
                    message: "PRODUCT was deleted successfully!"
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete PRODUCT with id=" + id
            });
        });
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
    PRODUCT.deleteMany({})
        .then(data => {
            res.send({
                message: `${data.deletedCount} PRODUCT were deleted successfully!`
            });
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while removing all products."
            });
        });
};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {
    PRODUCT.find({ published: true })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving products."
            });
        });
};