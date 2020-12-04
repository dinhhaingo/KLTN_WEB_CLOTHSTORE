const { query } = require("express");
const dbase = require("../models/index");
const CART = dbase.cart;
const PRODUCT = dbase.product;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');

dbase.mongoose = mongoose;

exports.insertToCart = async (req, res) => {
    const user = req.jwtDecoded;
    const { product_id, qty } = req.body.cart;

    if (!(product_id && qty)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    await PRODUCT.findOne({ product_id: product_id })
        .then(async product => {
            if (!product) {
                return res.status(401).json({ message: "Sản phẩm không tồn tại" })
            } else if (product['product_qty'] < qty) {
                return res.status(500).json({ message: "Sản phẩm hết hàng!" })
            } else {
                await CART.aggregate([
                    {
                        $match:
                        {
                            $and:
                                [
                                    { fk_customer: user.id },
                                    { fk_product: product_id }
                                ]
                        }
                    }
                ])
                    .then(async cart => {
                        if (cart) {
                            const quantity = parseInt(qty) + cart['cart_product_qty'];
                            try {
                                await CART.update(
                                    { cart_id: cart['cart_id'] },
                                    { $set: { cart_product_qty: quantity } }
                                )
                            } catch (error) {
                                return res.status(500).json({ message: "Có lỗi xảy ra!" })
                            }
                        } else {
                            let message = "";
                            const newCart = new CART({
                                cart_id: await dbase.autoIncrement('cart'),
                                fk_customer: user.id,
                                fk_product: product_id,
                                cart_product_qty: qty
                            });
            
                            cart
                                .save(cart)
                                .then(data => {
                                    if (data) message = "Thêm giỏ hàng thành công!"
                                    else message = "Thêm giỏ hàng thất bại!"
                                })
                                .catch(err => {
                                    message = "Thêm giỏ hàng thất bại!"
                                });
                                
                            await CART.aggregate([
                                { $match: { fk_customer: user.id } }
                            ]).then(data => {
                                if (data) {
                                    return res.status(200).json({
                                        message: message,
                                        count: data.length
                                    })
                                } else {
                                    return res.status(200).json({ message: message })
                                }
                            }).catch(err => {
                                return res.status(200).json({ message: message })
                            })
                        }
                    })
                    .catch(err => {
                        return res.status(500).json({ message: "Có lỗi xảy ra!" })
                    });
            }
        }).catch(err => {
            return res.status(500).json({ message: "Có lỗi xảy ra!" });
        })
};

exports.getByCustomerId = async (req, res) => {
    const user = req.jwtDecoded;

    await CART.aggregate([
        { $match: { fk_customer: user.id } },
        { $sort: { cart_id: -1 } },
        {
            $lookup:
            {
                from: 'product',
                localField: 'fk_product',
                foreignFeild: 'product_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' }
    ]).then(cart => {
        if (cart) {
            return res.status(200).json({ cart });
        } else return res.status(200).json({ message: "Giỏ hàng trống!" })
    }).catch(err => {
        return res.status(500).json({ message: "Có lỗi xảy ra!!!" });
    })
};

exports.updateQty = async(req, res) => {
    const user = req.jwtDecoded;
    const { product_id, qty } = req.body.cart;

    if (!(product_id && qty)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    await PRODUCT.findOne({ product_id: product_id })
        .then(async product => {
            if (!product) {
                return res.status(401).json({ message: "Sản phẩm không tồn tại" })
            } else if (product['product_qty'] < qty) {
                return res.status(500).json({ message: "Sản phẩm hết hàng!" })
            } else {
                await CART.aggregate([
                    {
                        $match:
                        {
                            $and:
                                [
                                    { fk_customer: user.id },
                                    { fk_product: product_id }
                                ]
                        }
                    }
                ])
                    .then(async cart => {
                        if (cart) {
                            const quantity = parseInt(qty) + cart['cart_product_qty'];
                            try {
                                await CART.update(
                                    { cart_id: cart['cart_id'] },
                                    { $set: { cart_product_qty: quantity } }
                                )
                            } catch (error) {
                                return res.status(500).json({ message: "Có lỗi xảy ra!" })
                            }
                        } else {
                            res.status(400).json({message: "Không tìm thấy sản phẩm trong giỏ hàng!"});
                        }
                    })
                    .catch(err => {
                        return res.status(500).json({ message: "Có lỗi xảy ra!" })
                    });
            }
        }).catch(err => {
            return res.status(500).json({ message: "Có lỗi xảy ra!" });
        })
};
