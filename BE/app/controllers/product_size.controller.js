const { query } = require("express");
const dbase = require("../models/index");
const PRODUCTSIZE = dbase.productSize;
const mongoose = require("mongoose");

dbase.mongoose = mongoose;

exports.getAll = async(req, res) => {
    await PRODUCTSIZE.find().then(data => {
        res.status(200).json(data);
    }).catch(err => {
        res.status(500).json({message: err.message || "Không tìm được size sản phẩm"})
    })
}

exports.getByProductType = async(req, res) => {
    await PRODUCTSIZE.find({product_type_fk: req.body.product_type}).then(data => {
        res.status(200).json(data);
    }).catch(err => {
        res.status(500).json({message: err.message || "Không tìm được size sản phẩm"})
    })
}