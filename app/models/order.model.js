module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        order_id: Number,
        customer_fk: Number,
        order_customer_address: String,
        order_customer_phone: String,
        order_customer_name: String,
        order_status_fk: Number,
        order_payment_success_at: Date,
        order_payment_fail_at: Date
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Order = mongoose.model("order", schema);
    return Order;
  };