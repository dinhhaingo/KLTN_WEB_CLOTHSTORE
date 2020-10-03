module.exports = mongoose => {
    var schema = mongoose.Schema({
        product_comment_id: Number,
        product_comment_title: String,
        product_comment_message: String,
        customer_fk: Number,
        product_fk: Number
    }, { timestamps: true });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const ProductComment = mongoose.model("product_comment", schema);
    return ProductComment;
};