module.exports = mongoose => {
    var schema = mongoose.Schema({
        user_id: Number,
        content: String
    }, { timestamps: true });

    // schema.method("toJSON", function() {
    //     const { __v, _id, ...object } = this.toObject();
    //     object.id = _id;
    //     return object;
    // });

    const POST = mongoose.model("posts", schema);
    return POST;
};