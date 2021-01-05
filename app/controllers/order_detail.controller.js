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

dbase.mongoose = mongoose

exports.getByOrderId = async (req, res) => {
    const id = req.query.id;

    const order = await ORDER.aggregate([
        { $match: { order_id: parseInt(id) } },
        {
            $lookup:
            {
                from: 'order_statuss',
                localField: 'order_status_fk',
                foreignField: 'order_status_id',
                as: 'order_status'
            }
        },
        { $unwind: '$order_status' },
        {
            $lookup:
            {
                from: 'order_details',
                localField: 'order_id',
                foreignField: 'order_fk',
                as: 'order_detail'
            }
        }
    ]).then(async (data) => {
        for (let i = 0; i < data.length; i++) {
            const detail = data[i]['order_detail'];
            let total = 0;
            for (let j = 0; j < detail.length; j++) {
                const productInfo = await PRODUCT.findOne({ product_id: detail[j]['product_fk'] })
                if (productInfo) {
                    detail[j]['productInfo'] = productInfo;
                }
                const sum = detail[j]['order_detail_paid_price'] * detail[j]['order_detail_qty'];
                detail[j]['total'] = sum;
                total += sum;
            };
            data[i]['total'] = total;
            data[i]['order_detail'] = detail;
            const date = data[i]['createdAt'];
            data[i]['createdAt'] = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
        };
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
}

