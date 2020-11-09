const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

var corsOptions = {
    origin: "http://192.168.0.104:4200",
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const db = require("./app/models/index/index");
db.mongoose
    .connect(db.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Connected to the database!");
    })
    .catch(err => {
        console.log("Cannot connect to the database!", err);
        process.exit();
    });

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
    res.json({ message: "Hello World 1111" });
});

// require("./app/routes/posts.route")(app);
// require("./app/routes/customer_voucher.route")(app);
// require("./app/routes/customer.route")(app);
// require("./app/routes/district.route")(app);
// require("./app/routes/order_detail.route")(app);
// require("./app/routes/order_status.route")(app);
// require("./app/routes/order.route")(app);
 require("./app/routes/product.route")(app);
 require("./app/routes/employee.route")(app);

// require("./app/routes/product_comment.route")(app);
// require("./app/routes/product_rating.route")(app);
require("./app/routes/product_size.route")(app);
require("./app/routes/product_type.route")(app);
// require("./app/routes/province.route")(app);
// require("./app/routes/voucher.route")(app);
// set port, listen for requests

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});