module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        product_size_id: Number,
        product_size_title: String,
        product_type_fk: Number
      },
      { timestamps: false }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const ProductSize = mongoose.model("product_size", schema);
    return ProductSize;
  };