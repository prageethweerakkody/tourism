// server.js
var flash = require('connect-flash');

var express = require('express');
var app = express();
var mongojs = require('mongojs');
var db = mongojs('spotlist', ['spotlist', 'rawImageData', 'users', 'apps']);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override')

// Passport
var passport = require('passport');
var expressSession = require('express-session');
var strategy = require('passport-http');
var LocalStrategy = require('passport-local').Strategy;
app.use(expressSession({secret: 'hsafEJa124'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(methodOverride());

// Top level admin constant
const topAdmin = "a123";

// utilization
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// PW Encryption暗号化
var bCrypt = require('bcrypt-nodejs');
var encrypt = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};

var decrypt = function(user, password){
    return bCrypt.compareSync(password, user.password);
}

// verify user ユーザー認証チェック
passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    },
    function(username, password, done) {
        // find and compare password for given user name, redirects to login if incorrect pw
        db.users.findOne({username: username}, function(err, doc){
            if(doc === null){
                console.log('ユーザー情報が間違っています。');
                return done(null, false, { message: '認証情報が間違っています' });
            }

            else if(bCrypt.compareSync(password, doc.password)){
                    var user = {id:username, password:password};
                    return done(null, user);
            }
            else{
                console.log('ユーザー情報が間違っています。');
                return done(null, false, { message: '認証情報が間違っています' });
            }
        });
    }
));


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.users.findOne({username: id}, function(err, doc){
        if(doc != null) {
            user = {username: doc.username, password: doc.password}
            done(err,user);
        }
   });
});

// authentication 認証
function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) { console.log("inside");return next(); }
    console.log("認証されておりません...ログイン画面へ戻ります。");
    res.redirect('/login');
}

function mustBeAuthenticated(req, res, next) {
    if(req.isAuthenticated()) { return next(); }
    res.status(401).send('セッションの期限が切れました、再びログインしてください。');
}

// checks if top admin is logged in
// used in appropriate functions after checking that a user is logged in
function isTopAdmin(req, res, next){
    if(req.user.username === topAdmin){ //const for main admin username 
        return next();
    }
    else{
        res.writeHead(403, {'Content-Type': 'text/plain'});
        res.end('許可がありません');
    } 
}

// top
app.get('/', function(req, res){
    res.redirect('/login');
});

// control panel 制御盤
app.get('/control', ensureAuthenticated, function(req, res){
    res.sendFile(__dirname + '/public/control.html');
});

app.get('/spotlist', ensureAuthenticated, function(req, res){
    console.log("get request");

    db.spotlist.find(function (err, docs){
        console.log("get docs");
        res.json(docs);

    });

});

app.get('/rawImageData', ensureAuthenticated, function(req, res){

    db.rawImageData.find(function (err, docs){
        console.log("get docs");
        res.json(docs);
    });

});

app.get('/rawTweetData', ensureAuthenticated, function(req, res){

    db.rawTweetData.find(function (err, docs){
        console.log("rawTweetData");
        res.json(docs);
    });

});

//facebook写真取得
app.get('/rawFacebookData', ensureAuthenticated, function(req, res){

    db.rawFacebookData.find(function (err, docs){
        console.log(docs);
        res.json(docs);
    });

});


app.post('/spotlist', ensureAuthenticated, function(req, res){
    console.log(req.body);
        db.spotlist.insert(req.body, function(err, doc){
            res.json(doc);
    });
});

app.delete('/spotlist/:id', ensureAuthenticated, function(req, res){
    var id = req.params.id;
    console.log(id);
    db.spotlist.remove({_id: mongojs.ObjectId(id)}, function(err, doc){
        res.json(doc);
    });
});

app.get('/spotlist/:id', ensureAuthenticated, function(req,res){
    var id = req.params.id;
    console.log(id);
    db.spotlist.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
        res.json(doc);
    });
});

app.put('/spotlist/:id', ensureAuthenticated, function(req,res){
    var id = req.params.id;
    db.spotlist.findAndModify({query: {_id: mongojs.ObjectId(id)}, 
        update: {$set: {name: req.body.name, location: req.body.location, date: req.body.date, description_japanese: req.body.description_japanese, description_english:req.body.description_english, description_chinese:req.body.description_chinese, description_korean:req.body.description_korean, comment_japanese:req.body.comment_japanese, comment_english:req.body.comment_english, comment_chinese:req.body.comment_chinese, comment_korean:req.body.comment_korean, photo1:req.body.photo1, photo2:req.body.photo2, photo3:req.body.photo3, photo4:req.body.photo4, photo5:req.body.photo5,photo6:req.body.photo6, facebook1:req.body.facebook1, facebook2:req.body.facebook2, facebook3:req.body.facebook3, facebook4:req.body.facebook4, facebook5:req.body.facebook5}},
        new: true}, function(err, doc){
            res.json(doc);
    });
});

// auth functions(認証関数)
// 一時的な管理者登録 temp admin register
app.get('/register', function(req, res){});

// temp admin register
app.post('/register', function(req, res){
    var newUser = {username: req.body.username, password: encrypt(req.body.password)};
    db.users.insert(newUser, function(err, doc){
        res.json(doc);
    });
});

// GET login ログイン
app.get('/login', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

// POST login  ログイン
app.post('/login', passport.authenticate('local', { successRedirect: '/control', failureRedirect: '/login'}));

// logout
app.get('/logout',function(req,res){
    req.logout();
    res.redirect('/login');
});

// admin-driven user register (管理者による手動ユーザー登録)
app.get('/user_register', ensureAuthenticated, isTopAdmin, function(req, res){
    res.sendFile(__dirname + '/public/user_register.html');
});

// admin-driven user register ユーザー登録
app.post('/user_register', ensureAuthenticated, isTopAdmin, function(req, res){
    var newUser = {
                    username: req.body.username,
                    password: encrypt(req.body.password),
                    fullname: req.body.fullname,
                    mail: req.body.mail,
                    facebook: req.body.facebook_url,
                    company_name: req.body.company_name,
                    company_name_ruby: req.body.company_name_ruby,
                    postal_code: req.body.postal_code,
                    address: req.body.address,
                    fax_number: req.body.fax_number,
                    managed_spot: req.body.managed_spot
    };
    db.users.insert(newUser, function(err, doc){
        res.json(doc);
    });
});

// application information register アプリ登録
app.get('/app_register', ensureAuthenticated, function(req, res){
    res.sendFile(__dirname + '/public/app_register.html');
});

// application information register アプリ登録
app.post('/app_register', ensureAuthenticated, function(req, res){
    var newApp = {
                    name: req.body.name,
                    about: req.body.about,
                    image: req.body.image,
                    link: req.body.link,
                    contact_information: req.body.contact_information
    };
    db.apps.insert(newApp, function(err, doc){
        res.json(doc);
    });
});
app.listen(3000);
console.log("server running on port 3000");
