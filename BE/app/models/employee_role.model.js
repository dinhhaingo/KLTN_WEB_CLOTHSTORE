module.exports = mongoose => {
    var schema = mongoose.Schema({
        employee_role_id: Number,
        employee_role_title: String
    }, { timestamps: false });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const EMPLOYEEROLE = mongoose.model("employee_role", schema);
    return EMPLOYEEROLE;
};