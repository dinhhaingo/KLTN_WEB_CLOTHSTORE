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

// db.autoIncremet = require("../auto_increment.js")(mongoose);
db.autoIncrement = {
    getNextSequence: function(name) {
        var ret = db.counters.findAndModify({
            query: { _id: name },
            update: { $inc: { seq: 1 } },
            new: true
        });
        return ret.seq;
    }
}

module.exports = db;