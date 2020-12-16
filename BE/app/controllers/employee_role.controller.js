const { query } = require("express");
const dbase = require("../models/index");
const ROLE = dbase.employeeRole;
const mongoose = require("mongoose");

dbase.mongoose = mongoose;

exports.getAll = async(req, res) => {
    await ROLE.find().then(data => {
        res.status(200).json(data);
    }).catch(err => {
        res.status(500).json({message: err.message || "Không tìm role staff"})
    })
}