module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        province_id: Number,
        province_name: String
      },
      { timestamps: false }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Province = mongoose.model("province", schema);
    return Province;
  };