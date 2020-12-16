module.exports = mongoose => {
    var schema = mongoose.Schema({
        product_id: Number,
        product_images: Array,
        product_name: String,
        product_qty: Number,
        product_type_fk: Number,
        product_size_fk: Number,
        product_unit_price: Number,
        product_paid_price: Number,
        product_discount: Number,
        product_description: String,
        product_status: Boolean
    }, { timestamps: true });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Product = mongoose.model("product", schema);
    return Product;
};