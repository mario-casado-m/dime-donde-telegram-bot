var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var getproviders = require('./routes/getproviders');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/getproviders', getproviders);
app.post(`/${process.env['TELEGRAM_TOKEN']}` , (req, res) => {
    res.redirect(`/getproviders?q=${encodeURIComponent(req.body.message)}`)
})

module.exports = app;
