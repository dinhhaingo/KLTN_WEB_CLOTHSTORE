const { query } = require("express");
const dbase = require("../models/index");
const ORDER = dbase.order;
const PRODUCT = dbase.product;
const VOUCHER = dbase.voucher;
const ORDERDETAIL = dbase.orderDeatail;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');
const paginateInfo = require('paginate-info');

const debug = console.log.bind(console);

dbase.mongoose = mongoose;

exports.insertSaleOrder = async (req, res) => {
    const user = req.jwtDecoded;
    const data = req.body;

    if (!data){
        return res.status(500).json("Content can not be empty!");
    }
    
    let orderId = null
    let orderDeatailId = []
    let message = [];

    const order = new ORDER({
        order_id: await dbase.autoIncrement('order'),
        customer_fk: user.id,
        order_customer_name: data[0]['customer_name'],
        order_customer_phone: data[0]['customer_phone'],
        order_customer_address: data[0]['customer_address'],
        order_status: 1
    });

    order
        .save(order)
        .then(result => {
            orderId = result['order_id'];
        })
        .catch(err => {
            return res.status(500).json({message: "Không thể tạo đơn hàng!"});
        });

    await data.forEach(product => {
        const productId = product['product_id'];

        PRODUCT.findOne({product_id: productId})
        .then(productInfo => {

            if(productInfo['product_qty'] < product['qty']){
                const mess = 'Sản phẩm ' + productInfo['product_name'] + ' không đủ số lượng trong kho';
                message.push(mess);
            }

            const productPrice = productInfo['product_unit_price'];
            let newPrice = productInfo['product_paid_price'];
            let voucherId = null;
            
            if(product['voucher']){
                const voucherInfo = VOUCHER.findOne({voucher_code: product['voucher']});
                const today = new Date();
                if(voucherInfo && voucherInfo['voucher_available_at'] <= today 
                && voucherInfo['voucher_expired_at'] >= today 
                && voucherInfo['voucher_status'] == true 
                && (voucherInfo['voucher_qty'] == 0 || voucherInfo['voucher_remaining'] > 0)){
                    newPrice = newPrice * voucherInfo['voucher_value'] / 100;
                    voucherId = voucherInfo['voucher_id'];
                }
            }

            const orderDeatail = new ORDERDETAIL({
                order_detail_id: dbase.autoIncrement('order_detail'),
                order_fk: orderId || null,
                product_fk: productId,
                order_detail_unit_price: productPrice,
                order_detail_paid_price: newPrice,
                order_detail_qty: product['qty'],
                order_detail_voucher: voucherId || null
            })

            orderDeatail
                .save(orderDeatail)
                .then(result => {
                    orderDeatailId.push(result['order_detail_id']);

                    const remaining = productInfo['product_qty'] - product['qty'];

                    PRODUCT.updateOne(
                        { product_id: productInfo['product_id'] },
                        [{ $set: { product_qty: remaining } }]
                    )
                    .catch(err => {
                        message.push(err);
                    })
                })
                .catch(err => {
                    message.push(err);
                });
        })
        .catch(err => {
            message.push(err);
        });
    });

    return res.status(200).json({
        orderId: orderId,
        orderDetail: orderDeatailId,
        message: message
    })
}

exports.getAll = async (req, res) => {
    const { search, currentPage, sort } = req.query;

    let orderBy = -1;
    if(sort && sort === 'asc'){
        orderBy = 1;
    }
    
    const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, 10);
    const order = await ORDER.aggregate([
        { $match: search ? { $text: { $search: search } } : {} },
        { $sort: { order_id: orderBy } },
        {
            $lookup:
            {
                from: 'customers',
                localField: 'customer_fk',
                foreignField: 'customer_id',
                as: 'customer'
            }
        },
        { $unwind: '$customer'},
        {
            $lookup:
            {
                from: 'order_statuss',
                localField: 'order_status_fk',
                foreignField: 'order_status_id',
                as: 'order_status'
            }
        },
        { $unwind: '$order_status'},
        {
            $lookup:
            {
                from: 'order_details',
                localField: 'order_id',
                foreignField: 'order_fk',
                as: 'order_detail'
            }
        },
        {
            $project: {
                _id: 0,
                order_id: 1, 
                order_customer_name: 1, 
                order_customer_phone: 1,
                order_customer_address: 1,
                order_status: 1,
                order_detail: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]).then(async (data) => {
        await data.forEach(order => {
            // const date = order['createdAt'];
            // order['createdAt'] = date.getFullYear() + date.getMonth() + date.getDate();
            order['order_status'] = order['order_status']['order_status_title'];
            let total = 0;
            order['order_detail'].forEach(detail => {
                total += (detail['order_detail_paid_price'] * detail['order_detail_qty']);
            });
            order['total'] = total;
            const date = order['createdAt'];
            order['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
            const update = order['updatedAt'];
            order['updatedAt'] = update.getFullYear() + '-' + update.getMonth() + '-' + update.getDate();
        });
        const count = data.length;
        const pagData = data.slice(offset, offset + limit);
        const pagInfo = paginateInfo.paginate(currentPage, count, pagData);

        await res.status(200).json({
            status: 'Success',
            data: pagData,
            meta: pagInfo,
            countPage: Math.ceil(count/10)
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
};

exports.getByCustomer = async(req, res) =>{
    const customer = req.jwtDecoded;
    const {currentPage, sort } = req.query;

    let orderBy = -1;
    if(sort && sort === 'asc'){
        orderBy = 1;
    }
    
    const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, 10);
    const order = await ORDER.aggregate([
        { $match: customer.id },
        { $sort: { order_id: orderBy } },
        {
            $lookup:
            {
                from: 'order_statuss',
                localField: 'order_status_fk',
                foreignField: 'order_status_id',
                as: 'order_status'
            }
        },
        { $unwind: '$order_status'},
    ]).then(async (data) => {
        const count = data.length;
        const pagData = data.slice(offset, offset + limit);
        const pagInfo = paginateInfo.paginate(currentPage, count, pagData);

        await res.status(200).json({
            status: 'Success',
            data: pagData,
            meta: pagInfo
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
}

