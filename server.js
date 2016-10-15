var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var validator = require('validator');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static(__dirname + "/colortag_testing"));


app.listen(process.env.PORT || 5000);
console.log("server is running on port 5000");
