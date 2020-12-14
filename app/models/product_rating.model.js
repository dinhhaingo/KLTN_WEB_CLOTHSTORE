module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        product_rating_id: Number,
        product_rating_value: Number,
        fk_customer: Number,
        fk_product: Number,
        product_rating_review: String
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const ProductRating = mongoose.model("product_rating", schema);
    return ProductRating;
  };