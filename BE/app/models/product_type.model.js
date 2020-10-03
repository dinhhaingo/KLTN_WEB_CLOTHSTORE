module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        product_type_id: Number,
        product_type_name: String
      },
      { timestamps: false }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const ProductType = mongoose.model("product_type", schema);
    return ProductType;
  };