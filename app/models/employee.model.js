module.exports = mongoose => {
    var schema = mongoose.Schema({
        employee_id: Number,
        employee_fullName: String,
        employee_userName: String,
        employee_password: String,
        employee_phone: String,
        employee_address: String,
        employee_province: Number,
        employee_district: Number,
        employee_role: String,
        employee_avatar: String,
        employee_gender: String,
        employee_status: Boolean
    }, { timestamps: false });

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Employee = mongoose.model("employee", schema);
    return Employee;
};