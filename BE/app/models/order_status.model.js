module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        order_status_id: Number,
        order_status_title: String
      },
      { timestamps: false }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const OrderStatus = mongoose.model("order_status", schema);
    return OrderStatus;
  };