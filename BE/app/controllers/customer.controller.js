const db = require("../models/index/index");
const CUSTOMER = db.customer;

// Create and Save a new Tutorial
exports.create = (req, res) => {
    // Validate request
    if (!req.body.customer_id) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    // Create a Tutorial
    const customer = new CUSTOMER({
        user_id: req.body.user_id,
        content: req.body.content
    });

    // Save Tutorial in the database
    customer
        .save(customer)
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
    const user_id = req.query.user_id;
    var condition = user_id ? { user_id: { $regex: new RegExp(user_id), $options: "i" } } : {};

    CUSTOMER.find(condition)
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
    const id = req.params.id;

    CUSTOMER.findById(id)
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

    const id = req.params.id;

    CUSTOMER.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
        .then(data => {
            if (!data) {
                res.status(404).send({
                    message: `Cannot update CUSTOMER with id=${id}. Maybe CUSTOMER was not found!`
                });
            } else res.send({ message: "CUSTOMER was updated successfully." });
        })
        .catch(err => {
            res.status(500).send({
                message: "Error updating CUSTOMER with id=" + id
            });
        });
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;

    CUSTOMER.findByIdAndRemove(id)
        .then(data => {
            if (!data) {
                res.status(404).send({
                    message: `Cannot delete CUSTOMER with id=${id}. Maybe CUSTOMER was not found!`
                });
            } else {
                res.send({
                    message: "CUSTOMER was deleted successfully!"
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete CUSTOMER with id=" + id
            });
        });
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
    CUSTOMER.deleteMany({})
        .then(data => {
            res.send({
                message: `${data.deletedCount} CUSTOMER were deleted successfully!`
            });
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while removing all customers."
            });
        });
};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {
    CUSTOMER.find({ published: true })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving customers."
            });
        });
};