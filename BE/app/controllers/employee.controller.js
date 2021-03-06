const { query } = require("express");
const dbase = require("../models/index");
const EMPLOYEE = dbase.employee;
const mongoose = require("mongoose");
const { cloudinary } = require('../config/cd.config');
const jwtHelper = require('../helper/jwt.helper');

const debug = console.log.bind(console);

dbase.mongoose = mongoose;
let linkImage = '';
let tokenList = {};

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "access-token-secret-kltn-dinhhai-vanhuy";
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "access-token-secret-kltn-dinhhai-vanhuy";
const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE || "3650d";
const accessTokenLife = process.env.ACCESS_TOKEN_LIFE || "1d";

// Create and Save a new Tutorial
exports.create = async (req, res) => {
    // Validate request
    const {username, password, confirmPass, role, name, phone, address, province, district, avatar, gender, status} = req.body;
    console.log(req.body);
    if (!(username && password && confirmPass)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const user = await EMPLOYEE.findOne({username});
    if(user){
        return res.status(400).json({msg: "Username đã tồn tại!!!"});
    }

    const encode = require('nodejs-base64-encode');
    const md5 = require('md5');
    linkImage = '';
    if (avatar) {
        var image = encode.encode(avatar, 'base64');
    }
    try {
        const uploadImage = await cloudinary.uploader.upload(image, {
            upload_preset: 'ml_default'
        });
        linkImage = uploadImage.url;
        console.log(uploadImage);
    } catch (error) {
        console.log(error);
    }

    // Create a Tutorial
    const employee = new EMPLOYEE({
        employee_id: await dbase.autoIncrement('employee'),
        employee_fullName: name,
        employee_phone: phone,
        employee_password: md5(password),
        employee_userName: username,
        employee_address: address,
        employee_province: province,
        employee_district: district,
        employee_role: role,
        employee_avatar: linkImage,
        employee_gender: gender,
        employee_status: status,
    });
    // Save Tutorial in the database
    employee
        .save(employee)
        .then(async (data) => {
            await res.send(data);
        })
        .catch(async (err) => {
            await res.status(500).send({
                message: err.message || "Some error occurred while creating the Tutorial."
            });
        });
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    const employee_id = req.query.employee_id;
    var condition = employee_id ? { employee_id: { $regex: new RegExp(employee_id), $options: "i" } } : {};

    EMPLOYEE.find(condition)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving tutorials."
            });
        });
};

exports.getAll = async (req, res) => {
    const condition = req.param.search;
    await EMPLOYEE.agregate([
        { $match: { $text: { $search: condition } } },
        { $sort: { $score: { $meta: 'textScore' } } },
        { group: { '_id': null, views: { $sum: '$views' } } },
        { $skip: 0 },
        { $limit: 10 }
    ]).then(async (data) => {
        await res.send(data);
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
};

exports.changePassword = async(req, res) => {
    const {username, password, confirmPass} = req.body

    if (!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }

    if(password !== confirmPass){
        return res.status(400).json({
            message: "Confirm password không đúng!"
        });
    }

    const md5 = require('md5');

    EMPLOYEE.updateOne(
        { 'employee_userName': username }, 
        [ { $set: { 'employee_password': md5(password) } } ]
        ).then(async (data) => {
            if (!data) {
                await res.status(404).send({
                    message: `Cannot update password`
                });
            } else res.send({ message: "Password was updated successfully." });
        })
        .catch(async (err) => {
            await res.status(500).send({
                message: "Error updating password with username=" + username
            });
        });;
}

exports.updateProfile = async(req, res) => {

    const {id, role, name, phone, address, province, district, avatar, gender, status, isChange} = req.body;

    if (!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }

    const encode = require('nodejs-base64-encode');
    linkImage = '';
    if (avatar && isChange) {
        var image = encode.encode(avatar, 'base64');
    }
    try {
        const uploadImage = await cloudinary.uploader.upload(image, {
            upload_preset: 'ml_default'
        });
        linkImage = uploadImage.url;
        console.log(uploadImage);
    } catch (error) {
        console.log(error);
    }

    EMPLOYEE.updateOne(
        { 'employee_id': id }, 
        [ { $set: 
            { 
            'employee_avatar': linkImage,
            'employee_fullName': name, 
            'employee_phone': phone, 
            'employee_address': address,
            'employee_province': province,
            'employee_district': district,
            'employee_role': role,
            'employee_gender': gender,
            'employee_status': status 
            } 
        } ]
        ).then(async (data) => {
            if (!data) {
                await res.status(404).send({
                    message: `Cannot update PRODUCT with id=${id}. Maybe PRODUCT was not found!`
                });
            } else res.send({ message: "PRODUCT was updated successfully." });
        })
        .catch(async (err) => {
            await res.status(500).send({
                message: "Error updating PRODUCT with id=" + id
            });
        });;
}

exports.updateImage = async(req, res) => {
    if (!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }
    const { request } = req.body;

    const encode = require('nodejs-base64-encode');
    linkImage = '';
    if (request.employee_avatar) {
        var image = encode.encode(request.employee_avatar, 'base64');
    }
    try {
        const uploadImage = await cloudinary.uploader.upload(image, {
            upload_preset: 'ml_default'
        });
        linkImage = uploadImage.url;
        console.log(uploadImage);
    } catch (error) {
        console.log(error);
    }

    const id = request.product_id;

    EMPLOYEE.updateOne({ 'product_id': id }, [{ $set: { 'employee_avatar': linkImage } }])
        .then(async (data) => {
            if (!data) {
                await res.status(404).send({
                    message: `Cannot update PRODUCT with id=${id}. Maybe PRODUCT was not found!`
                });
            } else res.send({ message: "PRODUCT was updated successfully." });
        })
        .catch(async (err) => {
            await res.status(500).send({
                message: "Error updating PRODUCT with id=" + id
            });
        });;
};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {
    EMPLOYEE.find({ published: true })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving products."
            });
        });
};

exports.login = async(req, res) =>{
    const {username, password} = req.body;
    const md5 = require('md5');
    if (!(username && password)){
        return res.status(400).send({
            message: "Phải nhập đầy đủ thông tin đăng nhập!"
        }); 
    }
    // const user1 = await EMPLOYEE.findOne({employee_userName: username});
    // console.log(user1);
    await EMPLOYEE.findOne({
        employee_userName: username 
    }, async(err, user) => {
        if(err) throw err;
        if(!user){
            res.status(401).json({ message: 'Không tìm thấy username!!!' });
        } else if(user) {
            if(md5(password) !== user.employee_password){
                res.status(401).json({ message: "Mật khẩu không đúng!!!" });
            } else {
                try {
                    const userData = {
                        id: user.employee_id,
                        username: username,
                        name: user.employee_fullName
                    }
                    const accessToken = await jwtHelper.generateToken(userData, accessTokenSecret, accessTokenLife);
                    const refreshToken = await jwtHelper.generateToken(userData, refreshTokenSecret, refreshTokenLife);
    
                    tokenList[refreshToken] = {userData, refreshToken, accessToken};
                    
                    return res.status(200).json(tokenList[refreshToken]);
                } catch (error) {
                    return res.status(500).json(error);
                }
            }
        }
    })
};

exports.refreshToken = async(req, res) =>{
    const refreshTokenFromClient = req.body.refreshToken;

    if(refreshTokenFromClient && tokenList[refreshTokenFromClient]){
        try {
            const decoded = await jwtHelper.verifyToken(refreshTokenFromClient, refreshTokenSecret);

            const userData = decoded.data;

            const accessToken = await jwtHelper.generateToken(userData, accessTokenSecret, accessTokenLife);

            return res.status(200).json({accessToken});
        } catch (error) {
            debug(error);

            res.status(403).json({
                message: "Invalid refresh token"
            });
        }
    } else {
        return res.status(403).send({
            message: "No token provided"
        });
    }
}

