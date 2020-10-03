module.exports = mongoose => {
    var schema = mongoose.Schema({
        customer_voucher_id: Number,
        customer_fk: Number,
        voucher_fk: Number
    }, { timestamps: true });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const CustomerVoucher = mongoose.model("customer_voucher", schema);
    return CustomerVoucher;
};