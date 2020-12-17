module.exports = mongoose => {
    var schema = mongoose.Schema({
        cart_id: Number,
        fk_customer: Number,
        fk_product: Number,
        cart_product_qty: Number,
        cart_is_buying: Number,
    }, { timestamps: false });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Cart = mongoose.model("cart", schema);
    return Cart;
};