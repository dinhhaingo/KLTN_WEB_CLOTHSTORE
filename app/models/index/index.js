const dbConfig = require("../../config/db.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
// db.post = require("../posts.model.js")(mongoose);
db.customerVoucher = require("../customer_voucher.model.js")(mongoose);
db.customer = require("../customer.model.js")(mongoose);
db.district = require("../district.model.js")(mongoose);
db.orderDetail = require("../order_detail.model.js")(mongoose);
db.order = require("../order.model.js")(mongoose);
db.orderStatus = require("../order_status.model.js")(mongoose);
db.product = require("../product.model.js")(mongoose);
db.productComment = require("../product_comment.model.js")(mongoose);
db.productRating = require("../product_rating.model.js")(mongoose);
db.productSize = require("../product_size.model.js")(mongoose);
db.productType = require("../product_type.model.js")(mongoose);
db.province = require("../province.model.js")(mongoose);
db.voucher = require("../voucher.model.js")(mongoose);
db.counters = require("../counters.model.js")(mongoose);
db.employee = require("../employee.model.js")(mongoose);
db.employeeRole = require("../employee_role.model.js")(mongoose);

db.autoIncrement = async (name) => {
        let result = await db.counters.findOne({ id: name })
        let temp = result.seq + 1
        await db.counters.findOneAndUpdate(
            { id: name },
            { seq: temp },
            { useFindAndModify: false }
        );

        return temp
}

module.exports = db;