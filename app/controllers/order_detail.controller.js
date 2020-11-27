const { query } = require("express");
const dbase = require("../models/index");
const ORDER = dbase.order;
const PRODUCT = dbase.product;
const VOUCHER = dbase.voucher;
const ORDERDETAIL = dbase.orderDeatail;
const mongoose = require("mongoose");
const jwtHelper = require('../helper/jwt.helper');
const paginateInfo = require('paginate-info');

const debug = console.log.bind(console);

dbase.mongoose = mongoose;

