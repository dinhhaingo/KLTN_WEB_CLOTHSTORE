const { query } = require("express");
const dbase = require("../models/index");
const RATING = dbase.productRating;
const ORDER = dbase.order;
const ORDERDETAIL = dbase.orderDetail;
const PRODUCT = dbase.product;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');

dbase.mongoose = mongoose;

exports.rateByCustomer = async (req, res) => {
    const user = req.jwtDecoded;
    const { product_id, value, review } = req.body;

    let isRating = false;

    if (!(product_id && value && review)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const product = await PRODUCT.findOne({ product_id: parseInt(product_id) })
    if (!product) {
        return res.status(401).json({ 
            message: "Sản phẩm không tồn tại",
            code: '02'
        })
    } else {
        const orderCustomer = await ORDER.aggregate([
            { $match: { customer_fk: user.data.id } },
            {
                $lookup: 
                {
                    from: 'order_details',
                    localField: 'order_id',
                    foreignField: 'order_fk',
                    as: 'order_detail'
                }
            },
            { $unwind: '$order_detail' }
        ])
        
        if(orderCustomer){
            for(let i = 0; i < orderCustomer.length; i++){
                if(orderCustomer[i]['order_detail']['product_fk'] == parseInt(product_id)){
                    isRating = true
                    break
                }
            }
        }

        if(isRating == false){
            return res.status(401).json({
                message: "Bạn phải mua hàng để đánh giá sản phẩm",
                code: '01'
            })
        }

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
            return res.status(500).json({
                message: "Bạn đã đánh giá sản phẩm, không thể đánh giá thêm!",
                code: '03'
            })
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
                rate['createdAt'] = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
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