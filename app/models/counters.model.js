module.exports = mongoose => {
    var schema = mongoose.Schema({
        id: String,
        seq: Number
    }, { timestamps: false });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Counters = mongoose.model("counters", schema);
    return Counters;
};