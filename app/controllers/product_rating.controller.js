const { query } = require("express");
const dbase = require("../models/index");
const RATING = dbase.productRating;
const PRODUCT = dbase.product;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');

dbase.mongoose = mongoose;

exports.rateByCustomer = async (req, res) => {
    const user = req.jwtDecoded;
    const { product_id, value } = req.body;

    if (!(product_id && value)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const product = await PRODUCT.findOne({ product_id: product_id })
    if (!product) {
        return res.status(401).json({ message: "Sản phẩm không tồn tại" })
    } else {
        const rating = await RATING.aggregate([
            {
                $match:
                {
                    $and:
                        [
                            { fk_customer: user.data.id },
                            { fk_product: product_id }
                        ]
                }
            }
        ]);
        let message = "";
        if (rating[0]) {
            return res.status(500).json({message: "Bạn đã đánh giá sản phẩm, không thể đánh giá thêm!"})
        } else {
            const newRating = new RATING({
                product_rating_id: await dbase.autoIncrement('rating'),
                fk_customer: user.data.id,
                fk_product: product_id,
                product_rating_value: value
            });

            newRating
                .save(newRating)
                .then(data => {
                    if (data) message = "Đánh giá sản phẩm thành công!"
                    else message = "Đánh giá sản phẩm thất bại!"
                })
                .catch(err => {
                    message = "Đánh giá sản phẩm thất bại!"
                });
        }
        await RATING.aggregate([
            { $match: { fk_customer: user.data.id } }
        ]).then(data => {
                return res.status(200).json({
                    message: message,
                    count: data
                });
        }).catch(err => {
            return res.status(200).json({ message: message, error: err })
        });

    }
};