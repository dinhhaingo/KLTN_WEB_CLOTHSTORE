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
    const { order_id } = req.body

    // const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, 10);
    const order = await ORDER.aggregate([
        { $match: { order_id: order_id } },
        { $sort: { order_id: -1 } },
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
        }
    ]).then(async (data) => {
        const count = data.length;
        // const pagData = data.slice(offset, offset + limit);
        // const pagInfo = paginateInfo.paginate(currentPage, count, pagData);

        await res.status(200).json({
            status: 'Success',
            data: data,
            // meta: pagInfo,
            // countPage: Math.ceil(count/10)
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
}

