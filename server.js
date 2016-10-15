var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var validator = require('validator');
var unirest = require('unirest');
var multer = require('multer');
var upload = multer({
    dest: 'uploads/'
});
var fs = require('fs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + "/mismatch-front-end"));
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');


function hexToHSB(hcode) {
    console.log(hcode);
    r = parseInt(hcode.slice(1, 3), 16);
    g = parseInt(hcode.slice(3, 5), 16);
    b = parseInt(hcode.slice(5, 7), 16);
    console.log(hcode, r, g, b);
    return rgbToHsb(r, g, b);
}

/*rgbToHsb taken from https://github.com/carloscabo/colz/blob/master/public/js/colz.class.js */

function rgbToHsb(r, g, b) {
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
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    // map top 360,100,100
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    v = Math.round(v * 100);

    return [h, s, v];
}

Number.prototype.between = function(a, b) {
    return (this >= a && this <= b);
};

function comparecolors(c1, c2) {
    hsb1 = hexToHSB(c1.color);
    hsb2 = hexToHSB(c2.color);
    h1 = hsb1[0];
    h2 = hsb2[0];
    s1 = hsb1[1];
    s2 = hsb2[1];
    b1 = hsb1[2];
    b2 = hsb2[2];



    console.log(hsb1, hsb2);
    if ((s1 < 20) && (s2 < 20) && b1.between(5, 85) && b2.between(5, 85)) {
        return {
            message: "You're wearing a lot of gray. Nice groutfit!"
        };
    }
    var message_proto = "Hey there! Your clothes are COLOR1 and COLOR2. They're SAT_TYPE colors and the shades are CONT_TYPE. These colors HUE_TYPE";
    message_proto = message_proto.replace("COLOR1", c1.label);
    message_proto = message_proto.replace("COLOR2", c2.label);
    h_diff = Math.abs(h1 - h2);
    s_diff = Math.abs(s1 - s2);
    b_diff = Math.abs(b1 - b2);
//everything above is better than the stuff below

    if (b1 < 25 && b2 < 25) {
        return {
            message: "You're wearing dark colors that will go well together."
        };
    }
    if ((b1 < 20 || b2 < 20) && b1 < 60 && b2 < 60) {
        return {
            message: "You're wearing a mix of a dark neutral and a lighter colors. These clothes work well and don't provide too much contrast."
        };
    }
    if (Math.abs(b1 - b2) > 50) {
        return {
            message: "You're wearing a high contrast outfit. This is bold statement."
        };
    }

    abs_diff = Math.abs(h1 - h2);
    if ((abs_diff < 200) && (abs_diff > 160)) {
        console.log("comp");
        return "{'type': 'complementary'}";
    } else {
        console.log(abs_diff);
        return {
            'abs_diff': abs_diff
        };
    }
}

app.get("/sweatertest", function(req, res) {
    unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
        .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
        .attach("image", fs.createReadStream("sweater.jpeg"))
        .field("palette", "simple")
        .field("sort", "relevance")
        .end(function(result) {
            console.log(result.status, result.headers, result.body);
            res.send(result.body.tags[0]);
        });
});


app.post("/colorof", upload.single('photo'), function(req, res) {
    var path = req.file.path;
    unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
        .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
        .attach("image", fs.createReadStream(path))
        .field("palette", "simple")
        .field("sort", "relevance")
        .end(function(result) {
            console.log(result.status, result.headers, result.body);
            res.send(result.body.tags[0]);
        });
});


app.post("/match2", upload.array("photos", 2), function(req, res) {
    unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
        .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
        .attach("image", fs.createReadStream(req.files[0].path))
        .field("palette", "simple")
        .field("sort", "relevance")
        .end(function(result) {
            var color1 = result.body.tags[0];
            unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
                .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
                .attach("image", fs.createReadStream(req.files[1].path))
                .field("palette", "simple")
                .field("sort", "relevance")
                .end(function(result) {
                    var color2 = result.body.tags[0];
                    res.send(comparecolors(color1, color2));
                });
        });
});

app.get('/fileup', function(req, res) {
    console.log("reqed fileup");
    res.render('fileup');
});

app.get('/twoup', function(req, res) {
    res.render('twoup');
});






app.listen(process.env.PORT || 5000);
console.log("server is running on port 5000");
