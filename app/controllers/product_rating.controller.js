const { query } = require("express");
const dbase = require("../models/index");
const RATING = dbase.productRating;
const PRODUCT = dbase.product;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');

dbase.mongoose = mongoose;

exports.rateByCustomer = async (req, res) => {
    const user = req.jwtDecoded;
    const { product_id, value, review } = req.body;

    if (!(product_id && value && review)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const product = await PRODUCT.findOne({ product_id: parseInt(product_id) })
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
                            { fk_product: parseInt(product_id) }
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
                product_rating_value: value ? parseInt(value) : 0,
                product_rating_review: review
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

exports.getByProductId = async(req, res) => {
    const product_id = req.query.product_id
    const star = req.query.number_star
    console.log(req.query.number_star)

    if(!product_id) return res.status(500).json({message: "Thiếu thông tin sản phẩm!"})

    const product = await PRODUCT.findOne({ product_id: parseInt(product_id) })
    if (!product) {
        return res.status(401).json({ message: "Sản phẩm không tồn tại" })
    } else {
        await RATING.aggregate([
            {
                $match:
                    { 
                        $and: 
                        [
                            {fk_product: parseInt(product_id) }, 
                            star ? { product_rating_value: parseInt(star)} : {} 
                        ]
                    }
            },
            {
                $lookup:
                {
                    from: 'customers',
                    localField: 'fk_customer',
                    foreignField: 'customer_id',
                    as: 'customer_info'
                }
            },
            { $unwind: '$customer_info' }
        ]).then(data => {
            data.forEach(rate => {
                const date = rate['createdAt'];
                rate['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
            });
            return res.status(200).json({data: data})
        })
        .catch(err => {
            return res.status(500).json({
                message: "Không có đánh giá nào cho sản phẩm",
                error: err
            })
        });
    }
}