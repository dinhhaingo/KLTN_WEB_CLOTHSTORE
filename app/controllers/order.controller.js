const { query } = require("express");
const dbase = require("../models/index");
const ORDER = dbase.order;
const PRODUCT = dbase.product;
const VOUCHER = dbase.voucher;
const ORDERDETAIL = dbase.orderDetail;
const CART = dbase.cart;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');
const paginateInfo = require('paginate-info');
const https = require('https');
const tree = require("../libs/tree.json");
const { nextTick } = require("process");
const { json } = require("body-parser");

const debug = console.log.bind(console);

dbase.mongoose = mongoose;

const partnerCodeReq = "MOMO";
const accessKeyReq = "F8BBA842ECF85";
const requestType = "captureMoMoWallet";
const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const orderInfoReq = "H2team";
const returnUrl = "http://192.168.0.101:4200";
const notifyUrl = "https://kltn-be.herokuapp.com/order/confirm-payment";
const extraData = "qrpay";

exports.insertSaleOrder = async (req, res) => {
    const user = req.jwtDecoded;
    const { data, customerInfo, paymentType } = req.body;

    if (!data) {
        return res.status(500).json("Content can not be empty!");
    }
    let payType = 1;
    if (paymentType !== "cod") {
        payType = 0;
    }

    let orderDeatailId = []
    let message = [];
    let amount = 0;

    let address = ''

    await Object.values(tree).map((item) => {
        if (item.code == customerInfo.customer_province) {
            address = item.name_with_type
            const dis = item.district;
            Object.values(dis).map((dist) => {
                if (customerInfo.customer_district === dist.code) {
                    address = address + ', ' + dist.name_with_type
                    const ward1 = dist.ward
                    Object.values(ward1).map((wardItem) => {
                        if (customerInfo.customer_ward === wardItem.code) {
                            address = address + ', ' + wardItem.name_with_type
                        }
                    });
                }
            });
        }
    });
    const orderId = await dbase.autoIncrement('order')
    address = address + ', ' + customerInfo.customer_address
    const order = new ORDER({
        order_id: orderId,
        customer_fk: user.data.id,
        order_customer_name: customerInfo.customer_fullName,
        order_customer_phone: customerInfo.customer_phone,
        order_customer_address: address,
        order_status_fk: 1,
        order_is_cod: payType,
        order_qr_url: ''
    });

    await order
        .save(order)
        .then(result => {
        })
        .catch(err => {
            return res.status(500).json({ message: "Không thể tạo đơn hàng!" });
        });

    for (let i = 0; i < data.length; i++) {
        const productId = data[i].fk_product;

        await PRODUCT.findOne({ product_id: productId })
            .then(async productInfo => {
                if (productInfo['product_qty'] < data[i].cart_product_qty) {
                    const mess = 'Sản phẩm ' + productInfo['product_name'] + ' không đủ số lượng trong kho';
                    message.push(mess);
                }

                const productPrice = productInfo['product_unit_price'];
                let newPrice = productInfo['product_paid_price'];
                // let voucherId = null;

                // if(product.voucher){
                //     const voucherInfo = VOUCHER.findOne({voucher_code: product.voucher});
                //     const today = new Date();
                //     if(voucherInfo && voucherInfo['voucher_available_at'] <= today 
                //     && voucherInfo['voucher_expired_at'] >= today 
                //     && voucherInfo['voucher_status'] == true 
                //     && (voucherInfo['voucher_qty'] == 0 || voucherInfo['voucher_remaining'] > 0)){
                //         newPrice = newPrice * voucherInfo['voucher_value'] / 100;
                //         voucherId = voucherInfo['voucher_id'];
                //     }
                // }
                const detailId = await dbase.autoIncrement('orderDetail')

                const orderDeatail = new ORDERDETAIL({
                    order_detail_id: detailId,
                    order_fk: orderId,
                    product_fk: productId,
                    order_detail_unit_price: productPrice,
                    order_detail_paid_price: newPrice,
                    order_detail_qty: data[i].cart_product_qty,
                    order_detail_voucher: null
                })

                await orderDeatail
                    .save(orderDeatail)
                    .then(async result => {
                        orderDeatailId.push(detailId);
                        const remaining = productInfo['product_qty'] - data[i].cart_product_qty;
                        amount += data[i].total;

                        await PRODUCT.updateOne(
                            { product_id: productInfo['product_id'] },
                            { $set: { product_qty: remaining } }
                        )

                        let cartId = data[i].cart_id;
                        await CART.deleteOne({ cart_id: cartId})
                    })
                    .catch(err => {
                        message.push(err);
                    });
            })
            .catch(err => {
                message.push(err);
            });
    };

    let status = 200;
    let qrCodeUrl = '';
    let urlPayMo = '';
    if (!message[0]) {
        if (paymentType === "momo") {
            const rawSign = "partnerCode=" + partnerCodeReq
                + "&accessKey=" + accessKeyReq
                + "&requestId=" + orderId.toString()
                + "&amount=" + amount.toString()
                + "&orderId=" + orderId.toString()
                + "&orderInfo=" + orderInfoReq
                + "&returnUrl=" + returnUrl
                + "&notifyUrl=" + notifyUrl
                + "&extraData=" + extraData;
            const crypto = require('crypto');
            const signature = crypto.createHmac('sha256', secretKey)
                .update(rawSign)
                .digest('hex');
            const data = JSON.stringify({
                partnerCode: partnerCodeReq,
                accessKey: accessKeyReq,
                requestId: orderId.toString(),
                amount: amount.toString(),
                orderId: orderId.toString(),
                orderInfo: orderInfoReq,
                returnUrl: returnUrl,
                notifyUrl: notifyUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature
            });

            let options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/gw_payment/transactionProcessor',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            let result = '';
            let status;
            let req = https.request(options, async (response) => {
                status = response.statusCode
                response.setEncoding('utf8');

                response.on('data', async (body) => {
                    result = result + body
                })

                response.on('end', async () => {
                    result = JSON.parse(result)
                    let errMo = false
                    if (status !== 200
                        || result.errorCode !== 0
                        || orderId !== parseInt(result.requestId)
                        || orderId !== parseInt(result.orderId)
                        || result.requestType !== requestType) {
                        errMo = true
                    } else {
                        const rawSignRes = "requestId=" + result.requestId
                            + "&orderId=" + result.orderId
                            + "&message=" + result.message
                            + "&localMessage=" + result.localMessage
                            + "&payUrl=" + result.payUrl
                            + "&errorCode=" + result.errorCode
                            + "&requestType=" + result.requestType;
                        const signatureRes = crypto.createHmac('sha256', secretKey)
                            .update(rawSignRes)
                            .digest('hex');
                        if (signatureRes !== result.signature) {
                            errMo = true
                        } else {
                            message.push('Đặt hàng thành công');
                            status = 200;
                            qrCodeUrl = result.qrCodeUrl
                            urlPayMo = result.payUrl

                            await ORDER.updateOne(
                                { order_id: orderId },
                                { $set: { order_qr_url: qrCodeUrl } }
                            )
                        }
                    }
                    if (errMo) {
                        message.push('Đặt hàng thất bại!');
                        status = 500;

                        await ORDER.updateOne(
                            { order_id: orderId },
                            {
                                $set:
                                {
                                    $and:
                                        [
                                            { order_payment_fail_at: new Date() },
                                            { order_status_fk: 4 }
                                        ]
                                }
                            }
                        )
                    } else {
                        status = 500;
                    }
                    return res.status(200).json({
                        status: status,
                        orderId: orderId,
                        orderDetail: orderDeatailId,
                        qrCodeUrl: qrCodeUrl || '',
                        urlPayMo: urlPayMo || '',
                        message: message
                    })
                });
            });

            req.on('error', (e) => {
                message = e.message;
            });
            req.write(data);
            req.end();
        } else {
            message.push("Đặt hàng thành công!")
        return res.status(200).json({
            status: status,
            orderId: orderId,
            orderDetail: orderDeatailId,
            message: message
        })
        }
    } else {
        message.push("Đặt hàng thành công!")
        return res.status(200).json({
            status: status,
            orderId: orderId,
            orderDetail: orderDeatailId,
            message: message
        })
    }
    // return res.status(200).json({
    //     status: status,
    //     orderId: orderId,
    //     orderDetail: orderDeatailId,
    //     qrCodeUrl: qrCodeUrl || '',
    //     urlPayMo: urlPayMo || '',
    //     message: message
    // })
};

exports.confirmPaymentMomo = async (req, res) => {
    const { partnerCode, accessKey, requestId, amount, orderId, orderInfo, orderType, transId, errorCode, message, localMessage, payType, responseTime, extraData, signature } = req.body;

    let code = 0;
    let messageRes = '';
    if (partnerCode !== partnerCodeReq || accessKey !== accessKeyReq || orderInfo !== orderInfoReq) {
        code = 58;
        messageRes = 'Sai thông tin cửa hàng!';
    } else {
        const rawSign = "partnerCode=" + partnerCode
            + "&accessKey=" + accessKey
            + "&requestId=" + requestId
            + "&amount=" + amount
            + "&orderId=" + orderId
            + "&orderInfo=" + orderInfo
            + "&orderType=" + orderType
            + "&transId=" + transId
            + "&message=" + message
            + "&localMessage=" + localMessage
            + "&responseTime=" + responseTime
            + "&errorCode=" + errorCode
            + "&payType=" + payType
            + "&extraData=" + extraData;

        const sign = crypto.createHmac('sha256', secretKey)
            .update(rawSign)
            .digest('hex');

        if (sign !== signature) {
            code = 5;
            messageRes = 'Sai thông tin chữ kí!';
        } else {
            const order = await ORDER.findOne({ order_id: orderId });
            if (!order) {
                code = 2
                messageRes = 'Đơn hàng không tồn tại!';
            } else {
                const detail = await ORDERDETAIL.aggregate([
                    { $match: { order_fk: orderId } }
                ]);
                if (errorCode === -1 || errorCode === 7) {
                    code = 0;
                    messageRes = 'Giao dịch đang xử lý!';
                    next();
                } else if (errorCode !== 0 || errorCode !== 34) {
                    code = 99;
                    messageRes = 'Giao dịch không thành công!';
                    await ORDER.updateOne(
                        { order_id: orderId },
                        {
                            $set:
                            {
                                $and:
                                    [
                                        { order_payment_fail_at: new Date() },
                                        { order_status_fk: 4 },
                                        { order_qr_url: '' }
                                    ]
                            }
                        }
                    )

                    detail.forEach(async item => {
                        let id = item['product_fk'];
                        let prod = await PRODUCT.findOne({ product_id: id })

                        let qty = prod['product_qty'] + item['order_detail_qty'];
                        await PRODUCT.updateOne(
                            { product_id: item['product_fk'] },
                            { $set: { product_qty: qty } }
                        )
                    });
                } else {
                    let total = 0
                    detail.forEach(item => {
                        total += item['order_detail_paid_price'] * item['order_detail_qty']
                    });

                    if (total !== amount || orderType != 'momo_wallet') {
                        code = 59;
                        messageRes = 'Thông tin đơn hàng hoặc giao dịch không đúng!';
                    } else {
                        code = 0
                        messageRes = 'Thành công'
                        await ORDER.updateOne(
                            { order_id: orderId },
                            {
                                $set:
                                {
                                    $and:
                                        [
                                            { order_payment_success_at: new Date() },
                                            { order_status_fk: 3 },
                                            { order_qr_url: '' }
                                        ]
                                }
                            }
                        )
                    }
                }
            }
        }
    }
    const time = new Date()
    const resTime = time.getFullYear() + '-'
        + time.getMonth() + '-'
        + time.getDate() + ' '
        + time.getHours() + ':'
        + time.getMinutes() + ':'
        + time.getSeconds();

    const rawSignRes = "partnerCode=" + partnerCode
        + "&accessKey=" + accessKey
        + "&requestId=" + requestId
        + "&orderId=" + orderId
        + "&errorCode=" + code
        + "&message=" + messageRes
        + "&responseTime=" + resTime
        + "&extraData=confirm";

    const signatureRes = crypto.createHmac('sha256', secretKey)
        .update(rawSignRes)
        .digest('hex');

    return res.status(200).json({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        orderId: orderId,
        errorCode: code,
        message: messageRes,
        responseTime: resTime,
        extraData: 'confim',
        signature: signatureRes
    })
}

exports.getAll = async (req, res) => {
    const { search, currentPage, sort } = req.query;

    let orderBy = -1;
    if (sort && sort === 'asc') {
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
        { $unwind: '$customer' },
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
            // order['order_status_vn'] = order['order_status']['order_status_title_vn'];
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
            countPage: Math.ceil(count / 10)
        });
    }
    ).catch(async (err) => {
        await res.status(500).send({
            message: err.message || "Some error occurred while retrieving tutorials."
        });
    });
};

exports.getByCustomer = async (req, res) => {
    const customer = req.jwtDecoded;
    const { currentPage, status } = req.query;

    let orderBy = -1;

    const { limit, offset } = paginateInfo.calculateLimitAndOffset(currentPage, 10);
    const order = await ORDER.aggregate([
        { $match: { $and: [{ customer_fk: customer.data.id }, status ? { order_status_fk: parseInt(status) } : {}] } },
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

            // if(data[i]['order_status_fk'] == 1 || data[i]['order_status_fk'] == 2){
            //     data[i]['isCancel'] = 1
            // } else {
            //     data[i]['isCancel'] = 0
            // }

            data[i]['total'] = total;
            data[i]['order_detail'] = detail;
            const date = data[i]['createdAt'];
            data[i]['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
        };
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
}

exports.getById = async (req, res) => {
    const customer = req.jwtDecoded;
    const id = req.query.id;

    const order = await ORDER.aggregate([
        { $match: { $and: [{ customer_fk: customer.data.id }, { order_id: parseInt(id) }] } },
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
            data[i]['createdAt'] = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
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

exports.changeOrderStatus = async (req, res) => {
    const customer = req.jwtDecoded;
    // const { order,  }
}

exports.cancelOrder = async (req, res) => {
    const customer = req.jwtDecoded;
    const id = req.body.id
    if(!id){
        return res.status(500).json({message: "Thiếu thông tin!"});
    }

    const order = await ORDER.findOne({ order_id: id })

    if (!order){
        return res.status(500).json({message: "Không tìm thấy đơn hàng!"})
    }

    if(order['order_status_fk'] == 1 || order['order_status_fk'] == 2){
        try {
            await ORDER.updateOne(
                { order_id: id },
                { $set: { order_status_fk: 5 } }
            );
        } catch(error){
            return res.status(500).json({message: 'Gặp lỗi khi hủy đơn hàng, thử lại sau!'})
        }
    } else {
        return res.status(500).json({message: "Không thể hủy đơn hàng!"})
    }
    return res.status(200).json({message: 'Hủy đơn hàng thành công!'})
}