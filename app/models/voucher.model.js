module.exports = mongoose => {
    var schema = mongoose.Schema({
        voucher_id: Number,
        voucher_title: String,
        voucher_value: Number,
        voucher_qty: Number,
        voucher_status: Number
    }, { timestamps: false });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Voucher = mongoose.model("voucher", schema);
    return Voucher;
};