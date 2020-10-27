module.exports = mongoose => {
    var schema = mongoose.Schema({
        config_status_id: Number,
        config_status_title: String
    }, { timestamps: false });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const ConfigStatus = mongoose.model("config_status", schema);

    return ConfigStatus;
};