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

function compare1(c1) {
    hsb1 = hexToHSB(c1.color);
    h1 = hsb1[0];
    s1 = hsb1[1];
    b1 = hsb1[2];

    if (s1 < 20 && b1.between(5, 85)) {
        return {
            "message": "That is gray."
        };
    };
    var message_proto = "This piece is is COLOR. Its a very nice color.";
    message_proto = message_proto.replace("COLOR", c1.label);

    return{
        "message": message_proto
    };
}

function compare2(c1, c2) {
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
            "message": "You're wearing a lot of gray. Nice groutfit!"
        };
    }
    var message_proto = "Your clothes are COLOR1 and COLOR2. The COLOR1 is SAT_COMMENT1 and COLOR2 is SAT_COMMENT2. These colors COMBO_COMMENT";
    message_proto = message_proto.replace("COLOR1", c1.label);
    message_proto = message_proto.replace("COLOR2", c2.label);
    message_proto = message_proto.replace("SAT_COMMENT1", get_sat_comment(s1));
    message_proto = message_proto.replace("SAT_COMMENT2", get_sat_comment(s2));
    message_proto = message_proto.replace("SAT_COMMENT2", get_combo_comment(h1, h2, s1, s2, b1, b2));
    return{
        "message": message_proto
    };
};


function get_combo_comment(h1, h2, s1, s2, b1, b2) {
    h_diff = Math.abs(h1 - h2);
    s_diff = Math.abs(s1 - s2);
    b_diff = Math.abs(b1 - b2);
    var response_string = "";
    if (170 <= h_diff && h_diff <= 190) {
        response_string += "are opposite colors. These dont quite match the way you would like."
    } else if (110 <= h_diff && h_diff <= 130) {
        response_string += "are two good colors, and they also match! Well done!"
    } else if (80 <= h_diff && h_diff <= 100) {
        response_string += "a good match!! Looking great!"
    } else if (0 <= h_diff && h_diff <= 20) {
        if (0 <= s_diff && s_diff <= 10) {
            response_string += "are maybe too similar. Consider changing something "
        }
        response_string += "are about the same. Congrats! You match!"
    } else {
        response_string += "are not in any recognized color pairing. You do you!"
    }
    return response_string;
}

function get_sat_comment(sat) {
    if (sat < 20) {
        return "a very dulled color"
    } else if (sat >= 20 && sat < 40) {
        return "a rather muted color"
    } else if (sat >= 40 && sat < 60) {
        return "neither particularly bright or dull"
    } else if (sat >= 60 && sat < 80) {
        return "a strongly saturagted color"
    } else {
        return "a bold, bright color"
    }
}



function compare3 (c1, c2, c3) {
    hsb1 = hexToHSB(c1.color);
    hsb2 = hexToHSB(c2.color);
    hsb3 = hexToHSB(c3.color);
    h1 = hsb1[0];
    h2 = hsb2[0];
    h3 = hsb3[0];
    s1 = hsb1[1];
    s2 = hsb2[1];
    s3 = hsb3[1];
    b1 = hsb1[2];
    b2 = hsb2[2];
    b3 = hsb3[2];

    var message_proto  = "Hi there! Your clothes are COLOR1, COLOR2, and COLOR3.  You're wearing SAT_TYPE. The clothes are BRIGHT_TYPE and HUE_TYPE.";
    message_proto = message_proto.replace("COLOR1", c1.label);
    message_proto = message_proto.replace("COLOR2", c2.label);
    message_proto = message_proto.replace("COLOR3", c3.label);
    var bright_type = "";
    var sat_type = "";
    var hue_type = "";

    if ((s1 > 65) && (s2 > 65) && (s3 > 65)) {
        sat_type = "many bold and vibrant colors";
    } else if ((s1 > 65) || (s2 > 70) || (s3 > 70)) {
       sat_type = "a mix of vibrant and and neutral colors.";
    } else if ((s1 < 60 ) && (s2 < 60) && (s3 < 60)) {
        sat_type = "all muted, more neutral tones" ;
    } else if ((s1 < 60 ) || (s2 < 60) || (s3 < 60)) {
        sat_type = "a mix of muted, more neutral tones, and vibrant colors";

    }



    if ((b1 > 65) && (b2 > 65) && (b3 > 65)) {
        bright_type  = "all bright clothes. These are perfect for summer and spring, ";
    } else if ((b1 > 65) || (b2 > 70) || (b3 > 70)) {
        bright_type = "a mix of bright and and darker clothes.";
    } else if ((b1 <= 65) && (b2 <= 70) && (b3 <= 70)) {
        bright_type = "darker colored clothes, perfect for a winter look,";
    }

    hdiff1 = Math.abs(h1 - h2);
    hdiff2 = Math.abs(h1 - h3);
    hdiff3 = Math.abs(h2 - h3);
    if (hdiff1.between(120,240) || hdiff2.between(120,240) || hdiff3.between(120,240)) {
       hue_type = "some colors are highly contrasted and clashing"; 
    } else if (hdiff1.between(0, 20) && hdiff2.between(0,20) && hdiff3.between(0,20)) {
        hue_type = "extremely similar and monochromatic in color.";
    } else if (hdiff1.between(0, 45) && hdiff2.between(0,45) && hdiff3.between(0, 45)) {
        hue_type = "are similar in color.";
    } else if (hdiff1.between(0, 100) || hdiff2.between(0, 100) || hdiff3.between(0, 100)) {
        hue_type = "are very different in color";
    }
    message_proto = message_proto.replace("SAT_TYPE", sat_type);
    message_proto = message_proto.replace("BRIGHT_TYPE", bright_type);
    message_proto = message_proto.replace("HUE_TYPE", hue_type);
    return {"message": message_proto};
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


app.post("/match3", upload.array("photos", 3), function(req, res) {
    console.log(req.files);
    var numfiles = req.files.length;
    unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
        .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
        .attach("image", fs.createReadStream(req.files[0].path))
        .field("palette", "simple")
        .field("sort", "relevance")
        .end(function(result) {
            var color1 = result.body.tags[0];
            if (numfiles == 1)
                return res.render('formresponse',compare1(color1));
            unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
                .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
                .attach("image", fs.createReadStream(req.files[1].path))
                .field("palette", "simple")
                .field("sort", "relevance")
                .end(function(result) {
                    var color2 = result.body.tags[0];
                    if (numfiles == 2)
                        return res.render('formresponse',compare2(color1, color2));
                    unirest.post("https://apicloud-colortag.p.mashape.com/tag-file.json")
                        .header("X-Mashape-Key", "0oXi6uvKF4mshYOnD1PRAiv18GEEp1dycKgjsnv3XLvqGL8xea")
                        .attach("image", fs.createReadStream(req.files[2].path))
                        .field("palette", "simple")
                        .field("sort", "relevance")
                        .end(function(result) {
                            var color3 = result.body.tags[0];
                            if (numfiles == 3)
                                return res.send('formresponse', compare3(color1, color2, color3));
                        });
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
