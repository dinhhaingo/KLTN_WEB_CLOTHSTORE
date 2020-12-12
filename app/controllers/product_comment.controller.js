const { query } = require("express");
const dbase = require("../models/index");
const COMMENT = dbase.ProductComment;
const PRODUCT = dbase.product;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');

dbase.mongoose = mongoose;

exports.commentByCustomer = async (req, res) => {
    const user = req.jwtDecoded;
    const { product_id, title, comment } = req.body;

    if (!(product_id && title && comment)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const product = await PRODUCT.findOne({ product_id: product_id })
    if (!product) {
        return res.status(401).json({ message: "Sản phẩm không tồn tại" })
    } else {
        const comment = await COMMENT.aggregate([
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
        if (comment[0]) {
            return res.status(500).json({message: "Bạn đã bình luận sản phẩm, không thể bình luận thêm!"})
        } else {
            const newComment = new COMMENT({
                product_comment_id: await dbase.autoIncrement('comment'),
                fk_customer: user.data.id,
                fk_product: product_id,
                product_comment_title: title,
                product_comment_message: comment
            });

            newComment
                .save(newComment)
                .then(data => {
                    if (data) message = "Bình luận sản phẩm thành công!"
                    else message = "Bình luận sản phẩm thất bại!"
                })
                .catch(err => {
                    message = "Bình luận sản phẩm thất bại!"
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
    const product_id = req.body.product_id

    if(!product_id) return res.status(500).json({message: "Thiếu thông tin sản phẩm!"})

    const product = await PRODUCT.findOne({ product_id: product_id })
    if (!product) {
        return res.status(401).json({ message: "Sản phẩm không tồn tại" })
    } else {
        await COMMENT.aggregate([{$match:{$and:[{ fk_product: product_id }]}}])
        .then(data => {
            return res.status(200).json({data: data})
        })
        .catch(err => {
            return res.status(500).json({
                message: "Không có comment nào cho sản phẩm",
                error: err
            })
        })
    }
}