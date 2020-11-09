module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        order_detail_id: Number,
        order_fk: Number,
        product_fk: Number
      },
      { timestamps: false }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const OrderDetail = mongoose.model("order_detail", schema);
    return OrderDetail;
  };