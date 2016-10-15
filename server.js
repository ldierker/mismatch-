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


/*taken from https://github.com/carloscabo/colz/blob/master/public/js/colz.class.js */
function rgbToHsb (r, g, b) {
    var max, min, h, s, v, d;

    r = r / 255;
    g = g / 255;
    b = b / 255;

    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    v = max;

    d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0; // achromatic
    } else {
      switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    // map top 360,100,100
    h = round(h * 360);
    s = round(s * 100);
    v = round(v * 100);

    return [h, s, v];
  }



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
