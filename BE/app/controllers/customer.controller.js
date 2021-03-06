const db = require("../models/index/index");
const CUSTOMER = db.customer;
const { cloudinary } = require('../config/cd.config');
const jwtHelper = require('../helper/jwt.helper');
const Auth = require('../middleware/AuthMiddleware');

const debug = console.log.bind(console);

let tokenList = {};

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "access-token-secret-kltn-dinhhai-vanhuy";
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "access-token-secret-kltn-dinhhai-vanhuy";
const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE || "3650d";
const accessTokenLife = process.env.ACCESS_TOKEN_LIFE || "1d";

const md5 = require('md5');

// Create and Save a new Tutorial
exports.create = (req, res) => {
    // Validate request
    if (!req.body.customer_id) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const request = req.body;
    // Create a Tutorial
    const customer = new CUSTOMER({
        customer_id: request.customer_id,
        customer_fullName: request.customer_fullName,
        customer_avatar: request.customer_avatar,
        customer_gender: request.customer_gender,
        customer_verify: request.customer_verify,
        customer_birthday: request.customer_birthday,
        customer_phone: request.customer_phone,
        customer_pass: request.customer_pass,
        customer_province: request.customer_province,
        customer_district: request.customer_district,
        customer_address: request.customer_address
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

exports.register = async (req, res) => {
    const { fullName, phone, password, confirmPass } = req.body;

    if (!(phone && fullName && password)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    const cus = await CUSTOMER.findOne({ customer_phone: phone })
    if (cus) {
        return res.status(400).json({ message: "Số điện thoại đã tồn tại!" });
    }

    if (password !== confirmPass) {
        res.status(400).send({ message: "Mật khẩu không trùng khớp!" });
        return;
    }
    // Create a Tutorial
    const customer = new CUSTOMER({
        customer_fullName: fullName,
        customer_avatar: null,
        customer_gender: null,
        customer_verify: 0,
        customer_birthday: null,
        customer_phone: phone,
        customer_pass: md5(password),
        customer_province: null,
        customer_district: null,
        customer_address: null
    });

    // Save Tutorial in the database
    await customer
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

exports.verifyCustomer = async (req, res) => {
    const phone = req.body.customer_phone;
    if (!phone) {
        return res.status(400).json({ message: "Không có thông tin người dùng!" });
    }

    const customer = CUSTOMER.findOne({ customer_phone: phone });
    if (!customer) {
        return res.status(400).json({ message: "Người dùng không tồn tại!" });
    }
    await EMPLOYEE.updateOne(
        { 'customer_phone': phone },
        [{ $set: { 'customer_verify': 1 } }]
    ).then(async (data) => {
        if (!data) {
            await res.status(404).send({ message: "Không thể xác thực người dùng!" });
        } else {
            res.status(200).json({ customer });
        }
    }).catch(async (err) => {
        await res.status(500).send({ message: "Không thể xác thực người dùng!" });
    });
}

exports.updateProfile = async (req, res) => {
    const { id, name, avatar, gender, birthday, phone, province, district, address, isChange } = req.body;

    if (!req.body) {
        return res.status(400).send({ message: "Dữ liệu không được rỗng!" });
    }

    const encode = require('nodejs-base64-encode');
    var linkImage: String;
    if (avatar && isChange) {
        var image = encode.encode(avatar, 'base64');
    }

    try {
        const uploadImage = await cloudinary.uploader.upload(image, {
            upload_preset: 'ml_default'
        });
        linkImage = uploadImage.url;
    } catch (error) {
        return res.status(400).json({
            message: "Không thể update avatar",
            error: error
        })
    }

    CUSTOMER.updateOne(
        { customer_id: id },
        [{
            $set: {
                customer_fullName: name,
                customer_avatar: linkImage,
                customer_gender: gender,
                customer_birthday: birthday,
                customer_phone: phone,
                customer_province: province,
                customer_district: district,
                customer_address: address
            }
        }]
    ).then(data => {
        if (!data) {
            return res.status(404).send({ message: "Không thể update thông tin người dùng!" });
        } else {
            res.status(200).send({ message: "Update thông tin thành công!!!" });
        }
    }).catch(err => {
        res.status(200).send({ message: "Không thể update thông tin người dùng" });
    });
};

exports.changePassword = async (req, res) => {
    const user = req.jwtDecoded;
    const { newPass, confirmPass } = req.body;

    if (!user.data.id) {
        return res.status(400).json({ message: "Không tồn tại trạng thái đăng nhập!" });
    }

    if (newPass !== confirmPass) {
        return res.status(400).json({ message: "Confirm Password không đúng!" });
    }

    CUSTOMER.updateOne(
        { customer_phone: user.data.username },
        [{
            $set: {
                customer_password: newPass
            }
        }]
    ).then(data => {
        if (!data) {
            return res.status(400).json({ message: "Không thể cập nhật mật khẩu!" });
        } else {
            return res.status(200).json({ message: "Thay đổi mật khẩu thành công!" });
        }
    }).catch(err => {
        return res.status(400).json({ message: "Không thể thay đổi mật khẩu", error: err });
    });
}

exports.forgotPassword = async (req, res) => {
    const { phone, newPass, confirmPass } = req.body;

    if (!(phone && newPass && confirmPass)) {
        return res.status(500).json({ message: "Thông tin không được bỏ trống!" });
    }

    if (newPass !== confirmPass) {
        return res.status(500).json({ message: "Confirm password không đúng!" });
    }

    const customer = await CUSTOMER.findOne({ customer_phone: phone })

    if (!customer) {
        return res.status(400).json({ message: "Không tìm thấy thông tin người dùng!" });
    }

    CUSTOMER.updateOne(
        { customer_id: customer.customer_id },
        [{
            $set: {
                customer_password: md5(newPass)
            }
        }]
    ).then(data => {
        if (!data) {
            return res.status(400).json({ message: "Không thể thay đổi password" })
        } else {
            return res.status(400).json({
                message: "Thay đổi password thành công",
                data: data
            });
        }
    }).catch(err =>{
        return res.status(400).json({message: "Không thể thay đổi password!"});
    })
}

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

exports.login = async(req, res) =>{
    const {phone, password} = req.body;
    const md5 = require('md5');
    if (!(phone && password)){
        return res.status(400).send({
            message: "Phải nhập đầy đủ thông tin đăng nhập!"
        }); 
    }

    await CUSTOMER.findOne({
        customer_phone: phone 
    }, async(err, user) => {
        if(err) throw err;
        if(!user){
            res.status(401).json({ message: 'Không tìm thấy username!!!' });
        } else if(user) {
            if(md5(password) !== user.password){
                res.status(401).json({ message: "Mật khẩu không đúng!!!" });
            } else {
                try {
                    const userData = {
                        id: user.customer_id,
                        username: phone,
                        name: user.customer_fullName
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
