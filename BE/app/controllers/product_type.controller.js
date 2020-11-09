const { query } = require("express");
const dbase = require("../models/index");
const PRODUCTTYPE = dbase.productType;
const mongoose = require("mongoose");

dbase.mongoose = mongoose;

exports.getAll = async(req, res) => {
    await PRODUCTTYPE.find().then(data => {
        res.status(200).json(data);
    }).catch(err => {
        res.status(500).json({message: err.message || "Không tìm được loại sản phẩm"})
    })
}