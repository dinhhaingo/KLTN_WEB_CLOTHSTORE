module.exports = mongoose => {
    const autoIncrement = require('mongoose-auto-increment');
    var schema = mongoose.Schema({
        customer_id: Number,
        customer_fullName: String,
        customer_avatar: String,
        customer_gender: String,
        customer_verify: Number,
        customer_birthday: Date,
        customer_phone: String,
        customer_pass: String,
        customer_province: String,
        customer_district: String,
        customer_ward: String,
        customer_address: String
    }, { timestamps: true });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Customer = mongoose.model("customer", schema);

    return Customer;
};