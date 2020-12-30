const { query } = require("express");
const dbase = require("../models/index");
const CUSTOMER = dbase.customer;
const PRODUCTTYPE = dbase.productType;
const ORDER = dbase.order;
const PRODUCT = dbase.product;
const ORDERDETAIL = dbase.orderDetail;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');
const { productType } = require("../models/index");

dbase.mongoose = mongoose;

exports.countAll = async(req, res) => {
    // const user = req.jwtDecoded
    
    let countProduct = 0;
    let countCus = 0;
    let countProType = 0;
    let countOrder = 0;

    const product = await PRODUCT.find()
    if(product){
        countProduct = product.length
    }

    const customer = await CUSTOMER.find()
    if(customer){
        countCus = customer.length
    }

    const proType = await PRODUCTTYPE.find()
    if(proType){
        countProType = proType.length
    }

    const order = await ORDER.find()
    if(order){
        countOrder = order.length
    }

    return res.status(200).json({
        countProduct: countProduct,
        countCustomer: countCus,
        countProductType: countProType,
        countOrder: countOrder
    })
}

exports.revenueYearly = async(req, res) => {
    const revenue = 100000000;
    let revenueLastYear = []
    let revenueNo = []
    for(let i = 0; i < 12;i ++){
        revenueLastYear[i] = {
            name: (i + 1),
            value: Math.floor(Math.random() * Math.floor(10000000))
        }
        revenueNo[i] = {
            name: (i + 1),
            value: 0
        }
    }

    const order = await ORDER.find()
    const today = new Date()
    
    if(order){
        for(let i = 0; i < order.length; i++){
            let date = order[i]['createdAt']
            if(date.getFullYear() == today.getFullYear()){
                let detail = await ORDERDETAIL.find({ order_fk: order[i]['order_id']})

                if(detail){
                    for (let j = 0; j < detail.length; j++){
                        revenueNo[date.getMonth()]['value'] += (detail[j]['order_detail_qty'] * detail[j]['order_detail_paid_price'])
                    }
                }
            }
        }
    }

    const data = [
        {
            name: 'Năm trước',
            data: revenueLastYear
        },
        {
            name: 'Năm nay',
            data: revenueNo
        }
    ]
    
    return res.status(200).json({ data: data })
}

exports.customerOrderd = async (req, res) => {
    let cusOrdered = [];

    const order = await ORDER.find()
    if(order){
        for(let i = 0; i < order.length; i++){
            if(cusOrdered.indexOf(order[i]['customer_fk']) == -1){
                cusOrdered.push(order[i]['customer_fk'])
            }
        }
    }

    const customer = await CUSTOMER.find()
    if(customer){
        const customerOrderd = parseFloat((cusOrdered.length / customer.length * 100).toFixed(2))
        return res.status(200).json({ customerOrderd: customerOrderd })
    }
    return res.status(500).json({ message: "Không tìm thấy khách hàng!" })
}

exports.typeProOrdered = async (req, res) => {
    const result = []

    const type = await PRODUCTTYPE.find()
    if(type){
        for(let i = 0; i < type.length; i++){
            result[type[i]['product_type_id']] = {
                name: type[i]['product_type_name'],
                value: 0,
                percent: 0
            }
        }
    }

    const orderDetail = await ORDERDETAIL.aggregate([
        {
            $lookup: 
            {
                from: 'products',
                localField: 'product_fk',
                foreignField: 'product_id',
                as: 'product_info'
            }
        },
        { $unwind: '$product_info' }
    ])
    let sum = 0;
    if(orderDetail){
        for(let i = 0; i < orderDetail.length; i++){
            let id = orderDetail[i]['product_info']['product_type_fk']

            sum += orderDetail[i]['order_detail_qty']
            if(result[id]['name']){
                result[id]['value'] += orderDetail[i]['order_detail_qty']
            } else {
                result[id]['value'] = orderDetail[i]['order_detail_qty']
            }   
        }
    }

    for(let i = 0; i < type.length; i++){
        result[type[i]['product_type_id']]['percent'] = parseFloat((result[type[i]['product_type_id']]['value'] / sum * 100).toFixed(2))
    }

    return res.status(200).json({ result: result })
}