module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        district_id: Number,
        district_name: String,
        province_fk: Number
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const District = mongoose.model("district", schema);
    return District;
  };