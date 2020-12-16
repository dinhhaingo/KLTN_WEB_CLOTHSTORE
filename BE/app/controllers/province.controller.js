const { query } = require("express");
const db = require("../models/index");
const mongoose = require("mongoose");
const tree = require("../libs/tree.json");
// const request = require('request');
const http = require('https');
const axios = require('axios');

db.mongoose = mongoose;

exports.getAllProvince = async (req, res) => {
    let data = [];
    await Object.values(tree).map((item) => data.push({key: item.code, title: item.name, full_title: item.name_with_type}));
    return res.json(data);
};

exports.getDistrictByProvince = async(req, res) => {
    const province = req.query.province

    let data = []
    await Object.values(tree).map((item) => {
        if(item.code == province){
            const district = item.district;
            Object.values(district).map((dist) => data.push({key: dist.code, title: dist.name, full_title: dist.name_with_type}));
        }
    });
    return res.json(data);
}

exports.getWardByDistrict = async(req, res) => {
    const { province, district } = req.query;

    let data = [];

    await Object.values(tree).map((item) => {
        if(item.code == province){
            const dist = item.district;
            Object.values(dist).map((distItem) => {
                if(distItem.code == district){
                    const ward = distItem.ward;
                    Object.values(ward).map((wardItem) => data.push({key: wardItem.code, title: wardItem.name, full_title: wardItem.name_with_type}));
                }
            });
        }
    });
    return res.json(data); 
}