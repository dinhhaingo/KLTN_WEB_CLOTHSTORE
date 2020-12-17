const { query } = require("express");
const dbase = require("../models/index");
const CART = dbase.cart;
const PRODUCT = dbase.product;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');

dbase.mongoose = mongoose;

exports.insertToCart = async (req, res) => {
    const user = req.jwtDecoded;
    const { product_id, qty } = req.body;

    if (!(product_id && qty)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const product = await PRODUCT.findOne({ product_id: product_id })
    if (!product) {
        return res.status(401).json({ message: "Sản phẩm không tồn tại" })
    } else if (product['product_qty'] < qty) {
        return res.status(500).json({ message: "Sản phẩm không đủ hàng!" })
    } else {
        const cart = await CART.aggregate([
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
        if (cart[0]) {
            const quantity = parseInt(qty) + cart[0]['cart_product_qty'];

            if (product['product_qty'] < quantity) {
                return res.status(500).json({ message: "Sản phẩm không đủ hàng!" })
            }
            try {
                await CART.updateOne(
                    { $and: [{ fk_customer: user.data.id }, { fk_product: parseInt(product_id) }] },
                    { $set: { cart_product_qty: quantity } }
                )
                message = "Thêm giỏ hàng thành công!";
            } catch (error) {
                return res.status(500).json({ message: "Có lỗi xảy ra!" })
            }
        } else {
            const newCart = await new CART({
                cart_id: await dbase.autoIncrement('cart'),
                fk_customer: user.data.id,
                fk_product: product_id,
                cart_product_qty: qty,
                cart_is_buying: 0
            });

            newCart
                .save(newCart)
                .then(data => {
                    if (data) message = "Thêm giỏ hàng thành công!"
                    else message = "Thêm giỏ hàng thất bại!"
                })
                .catch(err => {
                    message = "Thêm giỏ hàng thất bại!"
                });
        }

        await CART.aggregate([
            { $match: { fk_customer: user.data.id } }
        ]).then(async data => {
            const cart = await CART.aggregate([
                { $match: { fk_customer: user.data.id } },
                { $sort: { cart_id: -1 } },
                {
                    $lookup:
                    {
                        from: 'products',
                        localField: 'fk_product',
                        foreignField: 'product_id',
                        as: 'productInfo'
                    }
                },
                { $unwind: '$productInfo' }
            ]);

            let total = 0;
            if (cart) {
                cart.forEach(item => {
                    item['total'] = item['productInfo']['product_paid_price'] * item['cart_product_qty']
                    total += (item['productInfo']['product_paid_price'] * item['cart_product_qty'])
                });
            }
            return res.status(200).json({
                message: message,
                cart: cart,
                total: total,
                count: data.length
            })
        }).catch(err => {
            return res.status(200).json({ message: message })
        });
    }
};

exports.getByCustomerId = async (req, res) => {
    const user = req.jwtDecoded;
    const isBuying = req.query

    let data = []
    const cart = await CART.aggregate([
        { $match: { fk_customer: user.data.id } },
        { $sort: { cart_id: -1 } },
        {
            $lookup:
            {
                from: 'products',
                localField: 'fk_product',
                foreignField: 'product_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' }
    ]);
    if (cart) {
        if (parseInt(isBuying) === 1) {
            cart.forEach(item => {
                if (item['cart_is_buying'] === 1) {
                    data.push(item)
                }
            });
        } else {
            data = cart
        }
        let total = 0;
        data.forEach(item => {
            item['total'] = item['productInfo']['product_paid_price'] * item['cart_product_qty']
            total += (item['productInfo']['product_paid_price'] * item['cart_product_qty'])
        });
        return res.status(200).json({
            cart: data,
            count: data.length,
            total: total
        });
    } else return res.status(200).json({ message: "Giỏ hàng trống!" })
};

exports.updateQty = async (req, res) => {
    const user = req.jwtDecoded;
    const { product_id, qty } = req.body;

    if (!(product_id && qty)) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }
    const product = await PRODUCT.findOne({ product_id: product_id })
    if (!product) {
        return res.status(401).json({ message: "Sản phẩm không tồn tại" })
    } else if (product['product_qty'] < qty) {
        return res.status(500).json({ message: "Sản phẩm hết hàng!" })
    } else {
        const cart = await CART.aggregate([
            {
                $match: { fk_customer: user.data.id }
            }
        ])
        if (cart) {
            let totalCart = 0
            let total = 0
            for (let i = 0; i < cart.length; i++) {
                if (cart[i]['fk_product'] == parseInt(product_id)) {
                    await CART.updateOne(
                        { cart_id: cart[0]['cart_id'] },
                        { $set: { cart_product_qty: qty } }
                    )
                    total = product['product_paid_price'] * qty
                    totalCart += total
                } else {
                    totalCart += (cart[i]['cart_product_qty'] * product['product_paid_price'])
                }
            }
            return res.status(200).json({
                message: "Update thành công!",
                qty: qty,
                total: total,
                totalCart: totalCart
            })
        } else {
            res.status(400).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng!" });
        }
    }
};

exports.deletecart = async (req, res) => {
    const data = req.body.data;
    const user = req.jwtDecoded;

    if (!data) {
        return res.status(400).json({ message: "Không có thông tin sản phẩm" });
    }
    let arrFail = [];
    data.forEach(async id => {
        const product = await PRODUCT.findOne({ product_id: id })
        if (!product) {
            arrFail.push(id);
        } else {
            const cart = await CART.aggregate([
                {
                    $match:
                    {
                        $and:
                            [
                                { fk_customer: user.data.id },
                                { fk_product: id }
                            ]
                    }
                }
            ])
            if (cart) {
                try {
                    await CART.deleteOne({ cart_id: cart[0]['cart_id'] });
                } catch (error) {
                    arrFail.push(id)
                }
            } else {
                arrFail.push(id);
            }
        }
    });

    if (data.length == arrFail.length) {
        return res.status(400).json({ message: "Xóa giỏ hàng thất bại!" })
    } else {
        return res.status(200).json({
            message: "Xóa giỏ hàng thành công",
            arrFail: arrFail
        })
    }
}

exports.updateToBuying = async (req, res) => {
    const data = req.body.data;
    const user = req.jwtDecoded;

    if (!data) {
        return res.status(400).json({ message: "Không có thông tin sản phẩm" });
    }
    let arrFail = [];
    data.forEach(async id => {
        const cart = await CART.aggregate([
            {
                $match:
                {
                    $and:
                        [
                            { fk_customer: user.data.id },
                            { cart_id: id }
                        ]
                }
            }
        ])
        if (cart) {
            try {
                await CART.updateOne(
                    { cart_id: id },
                    { $set: { cart_is_buying: 1 } }
                );
            } catch (error) {
                arrFail.push(id)
            }
        } else {
            arrFail.push(id);
        }
    });

    if (data.length == arrFail.length) {
        return res.status(400).json({ message: "Thất bại!" })
    } else {
        return res.status(200).json({
            message: "Thành công",
            arrFail: arrFail
        })
    }
}