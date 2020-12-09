const { query } = require("express");
const dbase = require("../models/index");
const PRODUCT = dbase.product;
const ORDERDETAIL = dbase.orderDetail
const mongoose = require("mongoose");
const cloudinary = require('../config/cd.config');
const encode = require('nodejs-base64-encode');
const paginateInfo = require('paginate-info')

let base64 = require('base-64');

dbase.mongoose = mongoose;

exports.create = async (req, res) => {
    const { product_name, product_qty, product_type_fk, product_size_fk, product_unit_price, product_discount, product_description, product_images } = req.body.fashionCreate;

    let message = '';
    let arrImage = [];
    let paid_price = product_unit_price;

    if (!product_name) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
    }

    if (product_images) {
        for (let i = 0; i < product_images.length; i++) {
            const uploadImage = await cloudinary.uploads(product_images[i]);
            arrImage.push(uploadImage.url);
        }
    }

    if (product_discount) {
        paid_price = (100 - product_discount) * product_unit_price / 100;
    }
    const product = await new PRODUCT({
        product_id: await dbase.autoIncrement('product'),
        product_name: product_name,
        product_qty: product_qty,
        product_type_fk: product_type_fk,
        product_size_fk: product_size_fk,
        product_unit_price: product_unit_price,
        product_paid_price: paid_price,
        product_discount: product_discount,
        product_description: product_description,
        product_images: arrImage,
        product_status: true
    });

    await product
        .save(product)
        .then(async (data) => {
            await res.json({
                data: data,
                message: message
            });
        })
        .catch(async (err) => {
            await res.status(500).send({
                message: err.message || "Some error occurred while creating the Tutorial."
            });
        });
};

exports.getAll = async (req, res) => {

    const { search, currentPage, sort, type } = req.query;

    let orderBy = -1;
    if (sort && sort === 'asc') {
        orderBy = 1;
    }

    const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, 10);
    const product = await PRODUCT.aggregate([
        { $match: { $and: [search ? { $text: { $search: search } } : {}, type ? { product_type_fk: parseInt(type) } : {}] } },
        { $sort: { product_id: orderBy } },
        {
            $lookup:
            {
                from: 'product_types',
                localField: 'product_type_fk',
                foreignField: 'product_type_id',
                as: 'product_type'
            }
        },
        {
            $lookup:
            {
                from: 'product_sizes',
                localField: 'product_size_fk',
                foreignField: 'product_size_id',
                as: 'product_size'
            }
        }

    ]).then(async (data) => {
        data.forEach(product => {
            const date = product['createdAt'];
            product['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
        });
        const count = data.length;
        const pagData = data.slice(offset, offset + limit);
        const pagInfo = paginateInfo.paginate(currentPage, count, pagData);

        await res.status(200).json({
            status: 'Success',
            data: pagData,
            meta: pagInfo,
            countPage: Math.ceil(count / 10)
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });

};

exports.updateProduct = async (req, res) => {
    const { product_id, product_name, product_qty, product_type_fk, product_size_fk, product_unit_price, product_discount, product_description, product_images, product_status, isChange } = req.body.fashionEdit;
    const pro = await PRODUCT.findOne({ product_id: product_id });

    if (!pro) {
        return res.status(500).json({ message: "Không tìm thấy sản phẩm!" });
    }

    let arr = pro.product_images;
    let paid_price = product_unit_price;
    let message = '';

    if (!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }
    // if (pro.product_name != product_name) {
    //     res.status(500).json({ message: "Tên sản phẩm đã tồn tại!" });
    // }

    if (product_images && isChange) {
        arr = [];
        product_images.forEach(async (image) => {
            try {
                const uploadImage = await cloudinary.uploads(image);
                arr.push(uploadImage.url);
            } catch (error) {
                message = "Không thể update hình ảnh!"
            }
        });
    }

    if (product_discount) {
        paid_price = (100 - product_discount) * product_unit_price / 100;
    }

    try {
        await PRODUCT.update(
            { product_id: product_id },
            {
                $set:
                {
                    product_images: arr,
                    product_name: product_name,
                    product_qty: product_qty,
                    product_type_fk: product_type_fk,
                    product_size_fk: product_size_fk,
                    product_unit_price: product_unit_price,
                    product_paid_price: paid_price,
                    product_discount: product_discount,
                    product_description: product_description,
                    product_status: product_status
                }
            });
        const product = await PRODUCT.findOne({ product_id: product_id });

        if (product) {
            res.status(200).json({
                message: "Update sản phẩm thành công!",
                images: message,
                product: product
            })
        } else {
            res.status(500).json({ message: "Không tìm thấy sản phẩm!!!" });
        }
    } catch (error) {
        res.status(500).json({
            message: "Không thể update thông tin sản phẩm!",
            error: error
        })
    }
}

exports.updateImage = async (req, res) => {
    const { request } = req.body;
    if (!request) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }
    let arr = []

    if (request.product_images) {
        const arrImage = request.product_images;

        arrImage.forEach(async (image) => {
            try {
                const uploadImage = await cloudinary.uploader.upload(image, {
                    upload_preset: 'ml_default'
                });
                arr.push(uploadImage.url);
            } catch (error) {
                console.log(error);
            }
        });
    }

    const id = request.product_id;

    PRODUCT.updateOne({ 'product_id': id }, [{ $set: { 'product_images': arr || null } }])
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

exports.getProductDiscount = async (req, res) => {

    const { search, currentPage, sort, type } = req.query;

    let orderBy = -1;
    if (sort && sort === 'asc') {
        orderBy = 1;
    }

    let prod = [];

    const product = await PRODUCT.aggregate([
        { $match: { $and: [search ? { $text: { $search: search } } : {}, type ? { product_type_fk: parseInt(type) } : {}] } },
        { $sort: { product_id: orderBy } },
        {
            $lookup:
            {
                from: 'product_types',
                localField: 'product_type_fk',
                foreignField: 'product_type_id',
                as: 'product_type'
            }
        },
        { $unwind: '$product_type' },
        {
            $lookup:
            {
                from: 'product_sizes',
                localField: 'product_size_fk',
                foreignField: 'product_size_id',
                as: 'product_size'
            }
        },
        { $unwind: '$product_size' }
    ]).then(async (data) => {
        data.forEach(product => {
            if (product['product_unit_price'] > product['product_paid_price'] && product['product_status'] === true) {
                const date = product['createdAt'];
                product['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
                prod.push(product);
            }
        });

        await res.status(200).json({
            status: 'Success',
            data: prod
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });

};

exports.getProductRandom = async (req, res) => {
    let prod = [];
    const product = await PRODUCT.aggregate([
        {
            $lookup:
            {
                from: 'product_types',
                localField: 'product_type_fk',
                foreignField: 'product_type_id',
                as: 'product_type'
            }
        },
        { $unwind: '$product_type' },
        {
            $lookup:
            {
                from: 'product_sizes',
                localField: 'product_size_fk',
                foreignField: 'product_size_id',
                as: 'product_size'
            }
        },
        { $unwind: '$product_size' }

    ]).then(async (data) => {

        for (let i = 0; i < 3; i++) {
            prod.push(data[Math.floor(Math.random() * data.length)])
        }

        prod.forEach(product => {
            const date = product['createdAt'];
            product['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
        });

        await res.status(200).json({
            status: 'Success',
            data: prod
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
};

exports.getAllClient = async (req, res) => {

    const { currentPage, sort, type, value } = req.query;
    let val;
    if (value) {
        val = JSON.parse(value)
    };
    let orderBy = -1;
    if (sort && sort === 'asc') {
        orderBy = 1;
    }

    let prod = [];
    let min = 0;
    let max = 0;
    const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, 9);
    const product = await PRODUCT.aggregate([
        { $match: { $and: [type ? { product_type_fk: parseInt(type) } : {}, { product_status: true }] } },
        { $sort: { product_paid_price: orderBy } },
        {
            $lookup:
            {
                from: 'product_types',
                localField: 'product_type_fk',
                foreignField: 'product_type_id',
                as: 'product_type'
            }
        },
        { $unwind: "$product_type" },
        {
            $lookup:
            {
                from: 'product_sizes',
                localField: 'product_size_fk',
                foreignField: 'product_size_id',
                as: 'product_size'
            }
        },
        { $unwind: "$product_size" }
    ]).then(async (data) => {
        min = max = data[0]['product_paid_price'];
        data.forEach(product => {
            if (min > product['product_paid_price']) min = product['product_paid_price'];
            if (max < product['product_paid_price']) max = product['product_paid_price'];

            const date = product['createdAt'];
            product['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
        });
        if (value) {
            data.forEach(product => {
                if (product['product_paid_price'] >= val.minValue && product['product_paid_price'] <= val.maxValue) {
                    prod.push(product)
                }
            });
        } else prod = data;

        const count = prod.length;
        const pagData = prod.slice(offset, offset + limit);
        const pagInfo = paginateInfo.paginate(currentPage, count, pagData);

        await res.status(200).json({
            status: 'Success',
            data: pagData,
            meta: pagInfo,
            countPage: Math.ceil(count / 9),
            minPrice: min,
            maxPrice: max
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
};

exports.getProductHot = async (req, res) => {
    let prod = [];
    const orderDetail = await ORDERDETAIL.aggregate([
        { $match: { product_status: true } },
        {
            $group: {
                _id: "$product_fk",
                total: { $sum: "$order_detail_qty" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "count": -1 } }
    ]);

    const product = await PRODUCT.aggregate([
        {
            $lookup:
            {
                from: 'product_types',
                localField: 'product_type_fk',
                foreignField: 'product_type_id',
                as: 'product_type'
            }
        },
        { $unwind: '$product_type' },
        {
            $lookup:
            {
                from: 'product_sizes',
                localField: 'product_size_fk',
                foreignField: 'product_size_id',
                as: 'product_size'
            }
        },
        { $unwind: '$product_size' }

    ]).then(async (data) => {
        while (prod.length !== 3) {
            data.forEach(product => {
                const date = product['createdAt'];
                product['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();

                orderDetail.forEach(order => {
                    if (product['product_id'] == order['_id']) {
                        prod.push(product);
                        prod['total'] = order['total'];
                        prod['count'] = order['count'];
                    }
                });
            });
        }

        await res.status(200).json({
            status: 'Success',
            data: prod
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
};

exports.searchProduct = async (req, res) => {
    const search = req.query.search;

    const product = await PRODUCT.aggregate([
        { $match: { $and: [search ? { $text: { $search: search } } : {}, { product_status: true }] } },
        {
            $lookup:
            {
                from: 'product_types',
                localField: 'product_type_fk',
                foreignField: 'product_type_id',
                as: 'product_type'
            }
        },
        { $unwind: "$product_type" },
        {
            $lookup:
            {
                from: 'product_sizes',
                localField: 'product_size_fk',
                foreignField: 'product_size_id',
                as: 'product_size'
            }
        },
        { $unwind: "$product_size" }
    ]).then(async (data) => {
        data.forEach(product => {
            const date = product['createdAt'];
            product['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
        });

        await res.status(200).json({
            status: 'Success',
            data: data
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
};

// Find a single Tutorial with an id
exports.getById = async (req, res) => {
    const name = req.query.name;

    if (!name) {
        return res.status(500).json({ message: "Sản phẩm không xác định!" })
    }

    await PRODUCT.aggregate([
        { $match: { $and: [name ? { product_name: name } : {}, { product_status: true }] } },
        {
            $lookup:
            {
                from: 'product_types',
                localField: 'product_type_fk',
                foreignField: 'product_type_id',
                as: 'product_type'
            }
        },
        { $unwind: '$product_type' },
        {
            $lookup:
            {
                from: 'product_sizes',
                localField: 'product_size_fk',
                foreignField: 'product_size_id',
                as: 'product_size'
            }
        },
        { $unwind: '$product_size' }
    ]).then(data => {
        if (!data) {
            res.status(404).send({ message: "Không tìm thấy sản phẩm " });
        }
        else {
            data.forEach(product => {
                const date = product['createdAt'];
                product['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
            });

            res.status(200).json({
                status: 'Success',
                data: data
            });
        }
    }).catch(err => {
        res.status(500).json({ message: "Error retrieving Tutorial with id=" + id });
    });
};