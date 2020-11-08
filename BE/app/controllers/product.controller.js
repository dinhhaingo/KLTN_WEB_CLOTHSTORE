const { query } = require("express");
const dbase = require("../models/index");
const PRODUCT = dbase.product;
const mongoose = require("mongoose");
const {cloudinary} = require('../config/cd.config');

dbase.mongoose = mongoose;

// Create and Save a new Tutorial
exports.create = async (req, res) => {
    // Validate request
    const {name, qty, type, size, unitPrice, paidPrice, discount, description, images, status} = req.body;
    if (!name) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const pro = await PRODUCT.findOne({name});
    if(pro){
        return res.status(400).json({msg: "Sản phẩm đã tồn tại!"})
    }

    var arrImage = [];
    images.forEach(async(image) => {
        try {
            const uploadImage = await cloudinary.uploader.upload(image, {
                upload_preset: 'ml_default'
            });
            arrImage.push(uploadImage.url);
            console.log(uploadImage);
        } catch (error) {
            console.log(error);
        }
    });

    // Create a Tutorial
    const product = new PRODUCT({
        product_id: await dbase.autoIncrement('product'),
        product_name: name,
        product_qty: qty,
        product_type_fk: type,
        product_size_fk: size,
        product_unit_price: unitPrice,
        product_paid_price: paidPrice,
        product_discount: discount,
        product_description: description,
        product_images: arrImage,
        product_status: status
    });
    // Save Tutorial in the database
    product
        .save(product)
        .then(async(data) => {
            await res.send(data);
        })
        .catch(async(err) => {
            await res.status(500).send({
                message: err.message || "Some error occurred while creating the Tutorial."
            });
        });
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    const id = req.query.product_id;
    var condition = id ? { product_id: { $regex: new RegExp(id), $options: "i" } } : {};

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

exports.getAll = async(req, res) =>{
    const condition = req.param.search;
    await PRODUCT.agregate([
        { $match: { $text: { $search: condition } } },
        { $sort: { $score: { $meta: 'textScore' } } },
        { group: { '_id': null, views: { $sum: '$views' } } },
        { $skip: 0 },
        { $limit: 10 }
    ]).then(async(data) => {
        await res.send(data);
        }
    ).catch(async(err) =>{
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
};

exports.updateProduct = async(req, res) => {
    if (!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }
    const {id, name, qty, type, size, unitPrice, paidPrice, discount, description, images, status, isChange} = req.body;

    if (images && isChange){

        var arr =[]
        images.forEach(async(image) => {
            try {
                const uploadImage = await cloudinary.uploader.upload(image, {
                    upload_preset: 'ml_default'
                });
                arr.push(uploadImage.url);
            } catch (error) {
                console.log(error);
            }
        });
    }

    PRODUCT.updateOne(
        {'product_id': id},
        [ { $set: 
            { 
                'product_images': arr,
                'product_name': name,
                'product_qty': qty,
                'product_type_fk': type,
                'product_size_fk': size,
                'product_unit_price': unitPrice,
                'product_paid_price': paidPrice,
                'product_discount': discount,
                'product_description': description,
                'product_status': status
            } 
        } ] 
        ).then(async(data) => {
        if (!data) {
            await res.status(404).send({
                message: `Cannot update PRODUCT with id=${id}. Maybe PRODUCT was not found!`
            });
        } else res.send({ message: "PRODUCT was updated successfully." });
    })
    .catch(async(err) => {
        await res.status(500).send({
            message: "Error updating PRODUCT with id=" + id
        });
    });;
}

exports.updateImage = async(req, res) => {
    const { request } = req.body;
    if (!request) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }

    if (request.product_images){
        const arrImage = request.product_images;

        var arr =[]
        arrImage.forEach(async(image) => {
            try {
                const uploadImage = await cloudinary.uploader.upload(image, {
                    upload_preset: 'ml_default'
                });
                arr.push(uploadImage.url);
            } catch (error) {
                console.log(error);
            }
        });
    }

    const id = request.product_id;

    PRODUCT.updateOne({'product_id': id},[ { $set: { 'product_images': arr } } ] )
    .then(async(data) => {
        if (!data) {
            await res.status(404).send({
                message: `Cannot update PRODUCT with id=${id}. Maybe PRODUCT was not found!`
            });
        } else res.send({ message: "PRODUCT was updated successfully." });
    })
    .catch(async(err) => {
        await res.status(500).send({
            message: "Error updating PRODUCT with id=" + id
        });
    });;
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.product_id;

    PRODUCT.findbyIdAndRemove(id)
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