var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var validator = require('validator');
var unirest = require('unirest');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var fs = require('fs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static(__dirname + "/colortag_testing"));
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.get("/sweatertest", function (req,res) {
    unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
    .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
    .attach("image", fs.createReadStream("sweater.jpeg"))
    .field("palette", "simple")
    .field("sort", "relevance")
    .end(function (result) {
          console.log(result.status, result.headers, result.body);
        res.send(result.body.tags[0]);
    });
});


app.post("/colorof", upload.single('photo'),  function (req,res) {
    var path = req.file.path;
    unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
    .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
    .attach("image", fs.createReadStream(path))
    .field("palette", "simple")
    .field("sort", "relevance")
    .end(function (result) {
          console.log(result.status, result.headers, result.body);
        res.send(result.body.tags[0]);
    });
}); 

app.get('/fileup', function (req,res) {
    console.log("reqed fileup");
    res.render('fileup');
});


app.listen(process.env.PORT || 5000);
console.log("server is running on port 5000");
