// server.js
var flash = require('connect-flash');

var express = require('express');
var app = express();
var mongojs = require('mongojs');
var db = mongojs('spotlist', ['spotlist', 'rawImageData', 'rawTweetData', 'rawFacebookData', 'users', 'apps']);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override')
var uuid = require('node-uuid');

// ファイル制御
var fs = require('fs');

// Passport
var passport = require('passport');
var expressSession = require('express-session');
var strategy = require('passport-http');
var LocalStrategy = require('passport-local').Strategy;
app.use(expressSession({secret: 'hsafEJa124'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
  res.locals.login = req.isAuthenticated();
  next();
});
app.use(cookieParser());
app.use(methodOverride());

// Top level admin constant
const topAdmin = "a123"; // 仮
const topAdmin2 = "matatabiadmin";
const topAdmin3 = "devadmin";

const useTwitterAPI = true;
var tweetCountBatch = require("../sns_data/tweet_count.js");
var twitterBatch = require("../sns_data/twitter.js");
var instagramBatch = require("../sns_data/instagram.js");
var facebookBatch = require("../sns_data/facebook.js");

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

// その他の便利な関数
/* var getCurrentUserApp = function() {
    var currentUser = {};
    db.users.findOne({username: req.user.username}, function(err, doc){
        currentUser = doc;
        if(currentUser.managed_app){
            db.apps.findOne({_id: mongojs.ObjectId(currentUser.managed_app.id)}, function(err, doc){
                return(doc);
            });
        }
    });
} */

// for running the backup script
var exec = require('child_process').exec;

function millisecondsToMidnight() {

  var now = new Date();

  var midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  return midnight.getTime() - now.getTime();

}

function runBatches() {

  var oneHour = 1000 * 60 * 60;

  if (useTwitterAPI) {
    /* if both twitter batches run at once,
       they will likely trigger the api rate limit. */
    setTimeout(()=>{tweetCountBatch.main({facebook_messages: {$size: 0}})}, oneHour);
    twitterBatch.main();
  }
  instagramBatch.main();
  facebookBatch.main();

  exec("./backup.sh", (error, stdout, stderr)=>{console.dir(error)});

}

function loopBatches() {
  runBatches();
  var dayInMilliseconds = 1000 * 60 * 60 * 24;
  return setInterval(runBatches, dayInMilliseconds);
}

function startBatchOperations() {

  return setTimeout(loopBatches, millisecondsToMidnight());

}

// will run at midnight, then every 24 hours
startBatchOperations();



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
    if(req.isAuthenticated()) { return next(); }
    console.log("認証されておりません...ログイン画面へ戻ります。");
    res.redirect('/login');
}

function mustBeAuthenticated(req, res, next) {
    if(req.isAuthenticated()) { return next(); }
    res.status(401).send('セッションの期限が切れました、再びログインしてください。');
}

// Checks if top admin is logged in
// Used in appropriate functions after checking that a user is logged in
function isTopAdmin(req, res, next){
    if(req.user.username === topAdmin ||
        req.user.username === topAdmin2 ||
        req.user.username === topAdmin3){ //const for main admin username
        return next();
    }
    else{
        res.writeHead(403, {'Content-Type': 'text/plain'});
        res.end('許可がありません');
    }
}

// Top
app.get('/', function(req, res){
    res.redirect('/login');
});

// Control Panel 制御盤
app.get('/control', ensureAuthenticated, function(req, res){
    if(req.user.username === topAdmin ||
        req.user.username === topAdmin2 ||
        req.user.username === topAdmin3){ // Main admin has different featured control panel
        res.sendFile(__dirname + '/public/control.html');
    }
    else {
        res.sendFile(__dirname + '/public/mypage.html');
    }
});

// アプリのための公開スポットリスト関数
app.get('/spotlist_json', function(req, res){
    db.spotlist.find(function (err, docs){
        res.json(docs);
    });
});

// スポットを全て取得する
app.get('/spotlist', ensureAuthenticated, isTopAdmin, function(req, res){
    db.spotlist.find({}).sort({date: -1}, function (err, docs){
        res.json(docs);
    });
});

// マイスポットを全て取得する
app.get('/myspotlist', ensureAuthenticated, function(req, res){
    var currentUser = {};
    var currentUserApp = {};
    db.users.findOne({username: req.user.username}, function(err, doc){
        currentUser = doc;
        if(currentUser.managed_app){
            db.apps.findOne({_id: mongojs.ObjectId(currentUser.managed_app.id)}, function(err, doc){
                currentUserApp = doc._id; // アプリのIDによってスポットを識別します。
                db.spotlist.find({"app.id":currentUserApp}).sort({date: -1}, function(err, docs){
                    res.json(docs);
                });
            });
        }
    });
});

// Instagram
app.get('/rawImageData', ensureAuthenticated, function(req, res){
    db.rawImageData.find(function (err, docs){
        res.json(docs);
    });
});

// 該当スポットに関係しているInstagram画像を取得
app.get('/rawImageData/:id', ensureAuthenticated, function(req, res){
    var id = req.params.id;
    db.rawImageData.find({spot_id: mongojs.ObjectId(id)}, function (err, docs){
        res.json(docs);
    });
});

// 該当スポットに関するTwitterを取得する
app.get('/rawTweetData/:id', ensureAuthenticated, function(req, res){
    var id = req.params.id;
    var rawTweets = [];
    var tweets = [];
    db.rawTweetData.find({spot_id: mongojs.ObjectId(id)}, {text:1, _id:0}, function (err, docs){
        if (!docs || docs.length == 0) {
            res.json([{text: "対象となる口コミは存在しませんでした。"}]);
        }
        else {
            for(tweet in docs) {rawTweets.push(docs[tweet].text);} // Unwrap JSON

            rawTweets = rawTweets.filter(function (element, index, self) { // Get rid of duplicates
                return self.indexOf(element) === index;
            });

            for(tweet in rawTweets) { tweets.push({text: rawTweets[tweet]});} // Re-Wrap in JSON
            res.json(tweets);
        }
    });
});

// Facebookデータ取得(ユーザーIDから取得)
app.get('/userFacebookData', ensureAuthenticated, function(req, res){
    var currentUser = {};
    db.users.findOne({username: req.user.username}, function(err, doc){
        currentUser = doc;
        db.rawFacebookData.find({spot_id: mongojs.ObjectId(currentUser._id)}, function(err, doc){
            res.json(doc);
        })
    });
});

// facebook写真取得
app.get('/rawFacebookData', ensureAuthenticated, function(req, res){
    db.rawFacebookData.find(function (err, docs){
        res.json(docs);
    });
});

/* Add the image to the approved images collection,
   and remove it from the rawImageData collection. */
app.post('/approveItem', ensureAuthenticated, function(req, res){

  db[req.body.collectionName].findAndModify({
    query: {_id: mongojs.ObjectId(req.body.id)},
    update: {$set: {approvalStatus: req.body.approvalStatus}},
    new: true
  }, function(err, doc){res.json(doc);});
});

// PUT 指定画像を削除(管理者・ユーザー流用)
app.put('/spotlist/:id/:imageNumber', ensureAuthenticated, function(req, res){
    var id = req.params.id;
    var imageNumber = req.params.imageNumber;
    
    switch(imageNumber){ //どの画像を削除するかを判定
        case '1':
            var updateQuery = {photo_file1: null};
            var photoFile = 'photo_file1';
            break;
        case '2':
            var updateQuery = {photo_file2: null};
            var photoFile = 'photo_file2';
            break;
        case '3':
            var updateQuery = {photo_file3: null};
            var photoFile = 'photo_file3';
            break;
        case '4':
            var updateQuery = {photo_file4: null};
            var photoFile = 'photo_file4';
            break;
        case '5':
            var updateQuery = {photo_file5: null};
            var photoFile = 'photo_file5';
            break;
        default:
            break;
    }

    // console.log(updateQuery);
    // 指定の画像フィールドにnullを代入
    db.spotlist.findAndModify({
            query: {_id: mongojs.ObjectId(id)},
            update: {$set: updateQuery},
            new: true
            }, function(err, doc){
                res.json(photoFile);
        }); 
});

// add the spot to the database, and run any relevant batch scripts
app.post('/spotlist', ensureAuthenticated, function(req, res){
  // 現在ログイン中のユーザーのアプリ情報取得のために
  var currentUser = {};

  // 画像の保存パス
  // /(public)/images/spot/req.body.name_photo_file# + .png
  var path = '/images/spot/';
  var imagesUploaded = {photo_file1: req.body.photo_file1, photo_file2: req.body.photo_file2, photo_file3: req.body.photo_file3, photo_file4: req.body.photo_file4, photo_file5: req.body.photo_file5};
  var imagePaths = {photo_file1: null, photo_file2: null, photo_file3: null, photo_file4: null, photo_file5: null};

  if(!req.body.name) {
    return res.send();
  }

  for(var imageFile in imagesUploaded) {
      if(imagesUploaded[imageFile]){
          imagePaths[imageFile] = path + uuid.v1().split('-').join('') + '_' + imageFile +'.png'; //一意的ファイル名を生成
      }
  }

  //日付がなかったら自動で現時刻を取得
  var date = req.body.date;
  if(!date){
    date = new Date();
    date = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
  }

  //Androidアプリ対応
  if (req.body.tag_instagram) {var instagramTags = req.body.tag_instagram.split(",");}
  else {var instagramTags = [];}

  if (req.body.twitter_comments) {var twitterComments = req.body.twitter_comments;}
  else {var twitterComments = [];}

  if (req.body.facebook_images) {var facebookImages = req.body.facebook_images;}
  else {var facebookImages = [];}

  if (req.body.instagram_images) {var instagramImages = req.body.instagram_images;}
  else {var instagramImages = [];}

  if (req.body.facebook_messages) {var facebookMessages = req.body.facebook_messages;}
  else {var facebookMessages = [];}

  //新しいスポットデータ
  var newSpot = { // 個別にデータを代入し、必要なappデータを挿入
                  name: req.body.name,
                  name_english: req.body.name_english,
                  name_chinese: req.body.name_chinese,
                  name_korean: req.body.name_korean,
                  name_french: req.body.name_french,
                  //location: req.body.location,
                  date: date,
                  twitter_comments: twitterComments,
                  tweet_count: 0, // 人気順位付け用
                  description_japanese: req.body.description_japanese,
                  description_english: req.body.description_english,
                  description_chinese: req.body.description_chinese,
                  description_korean: req.body.description_korean,
                  description_french: req.body.description_french,
                  comment_english: req.body.comment_english,
                  comment_chinese: req.body.comment_chinese,
                  comment_korean: req.body.comment_korean,
                  comment_french: req.body.comment_french,
                  tag_spot: req.body.tag_spot,
                  tag_instagram: instagramTags,
                  lat: req.body.lat,
                  lon: req.body.lon,
                  photo_file1: imagePaths.photo_file1,
                  photo_file2: imagePaths.photo_file2,
                  photo_file3: imagePaths.photo_file3,
                  photo_file4: imagePaths.photo_file4,
                  photo_file5: imagePaths.photo_file5,
                  facebook_messages: facebookMessages,
                  instagram_images: instagramImages,
                  facebook_images: facebookImages,
                  app: {id: null, name: null}
  };

  db.users.findOne({username: req.user.username}, function(err, doc){
        currentUser = doc;
        if(currentUser.managed_app){
            db.apps.findOne({_id: mongojs.ObjectId(currentUser.managed_app.id)}, function(err, doc){
                newSpot.app.id = doc._id;
                newSpot.app.name = doc.name;
                db.spotlist.findOne({name: req.body.name}, function(err, doc){
                    if(!doc && req.body.name){ // スポット名が一意的である場合
                        db.spotlist.insert(newSpot, (err, doc)=>{
                        //return res.json(doc);
                        console.log(doc);
                        });
                     }
                     else {// スポット名が一意的でない場合
                        req.body.name = '';
                        req.body.tag_instagram = '';
                        imagesUploaded = {};
                        //res.json(doc);
                     }
                });
            });

            // 各ファイルのアップロード処理
            // Base64型データの変換・/images/spot/スポット名_ファイル番号で保存
            // 全ての画像は[.png]で保存されます。
            for(var imageFile in imagesUploaded) {
                if(imagesUploaded[imageFile]){
                    imagesUploaded[imageFile] = imagesUploaded[imageFile].replace(/^data:image\/.*;base64,/, "");
                    fs.writeFile(__dirname +
                        '/public' +
                        imagePaths[imageFile], new Buffer(imagesUploaded[imageFile], "base64"), function(err) {});
                }
            }
        }
        else{ // findOne()の性質上、二回も同じ処理を記述しないといけません
            db.spotlist.insert(newSpot, (err, doc)=>{
                //res.json(doc);
            });
        }
    });

  //db.spotlist.insert(newSpot, (err, doc)=>{res.json(doc);});

  // run the instagram batch if the post has an instagram tag listed
  if (req.body.tag_instagram) {

    instagramBatch.main({tag_instagram: instagramTags});

  }

  // run the twitter batch if the post has a spot name (should be every time)
  if (req.body.name && useTwitterAPI) {
    twitterBatch.main({name: req.body.name});
  }

    res.redirect('/control');
});

// スポット削除
// 変更点:isTopAdmin => 削除機能を流用できるように削除
app.delete('/spotlist/:id', ensureAuthenticated, function(req, res){ //
    var id = req.params.id;
    db.spotlist.remove({_id: mongojs.ObjectId(id)}, function(err, doc){
        res.json(doc);
    });
    db.rawTweetData.remove({spot_id: mongojs.ObjectId(id)}, function(err, doc){
        if (err) {console.dir(err);}
    });

    /* if the image data is still being downloaded when its spot is deleted,
       the data will be orphaned and will prevent those images from being
       downloaded in the future. */
    db.rawImageData.remove({spot_id: mongojs.ObjectId(id)}, function(err, doc){
        if (err) {console.dir(err);}
    });

    // facebook data is attached to users, not spots, so we don't delete that here

});

// PUT トップ画像の置換処理
app.put('/topimage/:id/:path', ensureAuthenticated, function(req,res){
    var id = req.params.id;
    var path = req.params.path;

    db.spotlist.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
        currentSpot = doc;
        if(path.charAt(0) === 'i'){ // Instagram画像の場合
            path = path.substr(1);
            path = currentSpot.instagram_images[path];
        }
        else if(path.charAt(1) === 'f'){ // Facebook画像の場合
            path = path.substr(1);
            path = currentSpot.facebook_images[path];
        }
        else { // 手動アップロード画像
            path = currentSpot[path];
        }
        db.spotlist.findAndModify({
            query: {_id: mongojs.ObjectId(id)},
            update: {$set: {top_image: path} },
            new: true
            }, function(err, doc){
                res.json(doc);
        });
    });
});

// GET スポット編集 Spot Edit
// 変更点:isTopAdmin => 削除機能を流用できるように削除
app.get('/spotlist/:id', ensureAuthenticated, function(req,res){
    var id = req.params.id;
    console.log(id);
    db.spotlist.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
        res.json(doc);
    });
});

// PUT スポット編集 Spot Edit
// 変更点:isTopAdmin => 削除機能を流用できるように削除
app.put('/spotlist/:id', ensureAuthenticated, function(req,res){
    var id = req.params.id;

    // 画像の保存パス
    // (public)/images/spot/req.body.name_photo_file# + .png
    var path = '/images/spot/';
    var imagesUploaded = {photo_file1: req.body.new_photo_file1, photo_file2: req.body.new_photo_file2, photo_file3: req.body.new_photo_file3, photo_file4: req.body.new_photo_file4, photo_file5: req.body.new_photo_file5};

    // 変更がない場合は既存の画像を続けて使用
    var imagePaths = {photo_file1: req.body.photo_file1, photo_file2: req.body.photo_file2, photo_file3: req.body.photo_file3, photo_file4: req.body.photo_file4, photo_file5: req.body.photo_file5};
    for(var image in imagesUploaded) {
        if(imagesUploaded[image]){
            imagePaths[image] = path + uuid.v1().split('-').join('') + '_' + image + '.png';
        }
    }

    //SNS画像選択処理
    var instagramImages = [];
    var facebookImages = [];

    db.spotlist.find({name: req.body.name}, function(err, docs){
        if((docs.length <= 1) && req.body.name){ // スポット名が一意的である場合

            // Instagramの部
            db.rawImageData.find({spot_id : mongojs.ObjectId(id), approvalStatus : true}, {display_src_local: 1, _id: 0 }, function (err, docs){
                for(var path in docs){
                    instagramImages.push(docs[path].display_src_local);
                }
                db.spotlist.findAndModify({query: {_id: mongojs.ObjectId(id)},
                    update: {$set: {instagram_images: instagramImages}
                    },
                    new: true}, function(err, doc){
                });
            });

            // Facebookの部
            db.users.findOne({username: req.user.username}, function(err, doc){
                currentUser = doc;
                db.rawFacebookData.find({spot_id : mongojs.ObjectId(currentUser._id), approvalStatus : true},
                    {full_picture_local: 1, _id: 0 }, function (err, docs){
                    for(var path in docs){
                        facebookImages.push(docs[path].full_picture_local);
                    }
                    db.spotlist.findAndModify({query: {_id: mongojs.ObjectId(id)},
                        update: {$set: {facebook_images: facebookImages}
                        },
                        new: true}, function(err, doc){
                    });
                });
            });

            var tagInstagram = [];
            if(req.body.tag_instagram) {

                if (Array.isArray(req.body.tag_instagram)) {
                  tagInstagram = req.body.tag_instagram;
                } else {
                  tagInstagram = req.body.tag_instagram.split(",");
                }

            }

            //Androidアプリ対応
            if (req.body.twitter_comments) {var twitterComments = req.body.twitter_comments;}
            else {var twitterComments = [];}

            if (req.body.facebook_messages) {var facebookMessages = req.body.facebook_messages;}
            else {var facebookMessages = [];}

            db.spotlist.findAndModify({query: {_id: mongojs.ObjectId(id)},
                update: {$set: {
                                name: req.body.name,
                                name_english: req.body.name_english,
                                name_chinese: req.body.name_chinese,
                                name_korean: req.body.name_korean,
                                name_french: req.body.name_french,
                                //location: req.body.location,
                                date: req.body.date,
                                twitter_comments: twitterComments,
                                description_japanese: req.body.description_japanese,
                                description_english: req.body.description_english,
                                description_chinese: req.body.description_chinese,
                                description_korean: req.body.description_korean,
                                description_french: req.body.description_french,
                                comment_english: req.body.comment_english,
                                comment_chinese: req.body.comment_chinese,
                                comment_korean: req.body.comment_korean,
                                comment_french: req.body.comment_french,
                                tag_spot: req.body.tag_spot,
                                tag_instagram: tagInstagram,
                                lat: req.body.lat,
                                lon: req.body.lon,
                                photo_file1: imagePaths.photo_file1,
                                photo_file2: imagePaths.photo_file2,
                                photo_file3: imagePaths.photo_file3,
                                photo_file4: imagePaths.photo_file4,
                                photo_file5: imagePaths.photo_file5,
                                facebook_messages: facebookMessages
                                //instagram_images: instagramImages,
                                //facebook_images: req.body.facebook_images
                                //app: req.body.app
                        }
                },
                new: true}, function(err, doc){
                    res.json(doc);
                    console.log(doc);

                    // 各ファイルのアップロード処理
                    // Base64型データの変換・/images/spot/スポット名_ファイル番号で保存
                    // 全ての画像は[.png]で保存されます。
                    for(var imageFile in imagesUploaded) {
                        if(imagesUploaded[imageFile]){
                            imagesUploaded[imageFile] = imagesUploaded[imageFile].replace(/^data:image\/.*;base64,/, "");
                            fs.writeFile(__dirname +
                                '/public' +
                                imagePaths[imageFile], new Buffer(imagesUploaded[imageFile], "base64"), function(err) {});
                        }
                    }
            });
        }
        else { //同一名スポットが存在する場合、もしくはスポット名が入力されていない場合
            res.status(500);
            res.json();
        }
    });
});

// GET auth functions(認証関数)
// 一時的な管理者登録 temp admin register
app.get('/register', function(req, res){});

// POST temp admin register
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

// *最上位管理者専用* ユーザー一覧
app.get('/userlist', ensureAuthenticated, isTopAdmin, function(req, res){
    db.users.find(function (err, docs){
        //console.log("get users");
        res.json(docs);
    });
});

// *最上位管理者専用* ユーザー削除
app.delete('/userlist/:id', ensureAuthenticated, isTopAdmin, function(req, res){
    var id = req.params.id;
    db.users.remove({_id: mongojs.ObjectId(id)}, function(err, doc){
        res.json(doc);
    });
});

// *最上位管理者専用* アプリ一覧
app.get('/applist', ensureAuthenticated, isTopAdmin, function(req, res){
    db.apps.find(function (err, docs){
        //console.log("get apps");
        res.json(docs);
    });
});

// アプリ一覧JSONデータ取得のため
app.get('/applist_json', function(req, res){
    db.apps.find(function (err, docs){
        res.json(docs);
    });
});

// *最上位管理者専用* アプリ削除
app.delete('/applist/:id', ensureAuthenticated, isTopAdmin, function(req, res){
    var id = req.params.id;
    db.apps.remove({_id: mongojs.ObjectId(id)}, function(err, doc){
        res.json(doc);
    });
});

//  *最上位管理者専用* Admin-driven user register (管理者による手動ユーザー登録)
app.get('/user_register', ensureAuthenticated, isTopAdmin, function(req, res){
    res.sendFile(__dirname + '/public/user_register.html');
});

// Admin-driven user register ユーザー登録
app.post('/user_register', ensureAuthenticated, isTopAdmin, function(req, res){

  var managedApp = req.body.managed_app ? {id: req.body.managed_app._id, name: req.body.managed_app.name} : {id: null, name: null};

  console.log(req.body.managed_app);
  var newUser = {
    username: req.body.username,
    password: encrypt(req.body.password),
    fullname: req.body.fullname,
    mail: req.body.mail,
    facebook_url: req.body.facebook_url,
    company_name: req.body.company_name,
    company_name_ruby: req.body.company_name_ruby,
    postal_code: req.body.postal_code,
    address: req.body.address,
    phone_number: req.body.phone_number,
    fax_number: req.body.fax_number,
    managed_app: managedApp // Changed from managed_spot to app
  };

  if(newUser.username && req.body.password && newUser.managed_app.id){
    db.users.findOne({username: req.body.username}, function(err, doc){
        if(!doc) { // ユーザー名の一意性が確認できました。
            db.users.insert(newUser, function(err, doc){
                res.json(doc);
            });
        }
        else{ // ユーザー名が既に登録されている
           newUser = {error: ''};
           req.body.facebook_url = '';
           res.json(newUser);
        }
    });
  }
  if (req.body.facebook_url) {

    facebookBatch.main({facebook_url: req.body.facebook_url});

  }

});

// GET Admin-driven user edit(管理者による手動ユーザー編集)
app.get('/userlist/:id', ensureAuthenticated, isTopAdmin, function(req, res){
    var id = req.params.id;
    db.users.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
        res.json(doc);
    });
});

// PUT Admin-driven user edit(管理者による手動ユーザー編集)
app.put('/userlist/:id', ensureAuthenticated, isTopAdmin, function(req,res){
    var id = req.params.id;
    var pwd = req.body.password;
    var currentApp = req.body.managed_app;
    if(req.body.new_password){ // new password provided, replace old
        pwd = encrypt(req.body.new_password)
    }

    db.users.findAndModify({query: {_id: mongojs.ObjectId(id)},
        update: {
            $set: {
                    username: req.body.username,
                    password: pwd,
                    fullname: req.body.fullname,
                    mail: req.body.mail,
                    facebook_url: req.body.facebook_url,
                    company_name: req.body.company_name,
                    company_name_ruby: req.body.company_name_ruby,
                    postal_code: req.body.postal_code,
                    address: req.body.address,
                    phone_number: req.body.phone_number,
                    fax_number: req.body.fax_number,
                    managed_app: {id: req.body.managed_app._id, name: req.body.managed_app.name}
            }
        },
        new: true}, function(err, doc){
            res.json(doc);
    });
});

// GET application information register アプリ登録
app.get('/app_register', ensureAuthenticated, function(req, res){
    res.sendFile(__dirname + '/public/app_register.html');
});

// application information register アプリ登録
app.post('/app_register', ensureAuthenticated, function(req, res){
    db.apps.insert(req.body, function(err, doc){
        res.json(doc);
    });
});

// GET Admin-driven app edit(管理者による手動アプリ編集)
app.get('/applist/:id', ensureAuthenticated, isTopAdmin, function(req, res){
    var id = req.params.id;
    db.apps.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
        res.json(doc);
    });
});

// PUT Admin-driven app edit(管理者による手動アプリ編集)
app.put('/applist/:id', ensureAuthenticated, isTopAdmin, function(req,res){
    var id = req.params.id;
    var img = req.body.image;
    var icon = req.body.facebook_icon

    // 画像の保存パス
    // /(public)/images/app/req.body.name_photo_file# + .png
    var path = '/images/app/';
    var imagesUploaded = {image: req.body.new_image, facebook_icon: req.body.new_facebook_icon};
    var imagePaths = {image: req.body.image, facebook_icon: req.body.facebook_icon};

    for(var imageFile in imagesUploaded) {
      if(imagesUploaded[imageFile]){
          imagePaths[imageFile] = path + uuid.v1().split('-').join('') + '_' + imageFile +'.png'; //一意的ファイル名を生成
      }
    }

    db.apps.findAndModify({query: {_id: mongojs.ObjectId(id)},
        update: {
            $set: {
                    name: req.body.name,
                    contact_information: req.body.contact_information,
                    about: req.body.about,
                    image: imagePaths.image,
                    facebook_icon: imagePaths.facebook_icon,
                    link_1: req.body.link_1,
                    link_1_name: req.body.link_1_name,
                    link_2: req.body.link_2,
                    link_2_name: req.body.link_2_name,
                    link_3: req.body.link_3,
                    link_3_name: req.body.link_3_name,
                    link_4: req.body.link_4,
                    link_4_name: req.body.link_4_name,
                    link_5: req.body.link_5,
                    link_5_name: req.body.link_5_name
            }
        },
        new: true}, function(err, doc){
            res.json(doc);
            // 各ファイルのアップロード処理
            // Base64型データの変換・/images/app/アプリ名_ファイル番号で保存
            // 全ての画像は[.png]で保存されます。
            for(var imageFile in imagesUploaded) {
                if(imagesUploaded[imageFile]){
                    imagesUploaded[imageFile] = imagesUploaded[imageFile].replace(/^data:image\/.*;base64,/, "");
                    fs.writeFile(__dirname + '/public' +
                       imagePaths[imageFile], new Buffer(imagesUploaded[imageFile], "base64"), function(err) {});
                }
            }
    });
});

// GET Current app managed by current user
app.get('/app', ensureAuthenticated, function(req, res){
    var currentUser = {};
    db.users.findOne({username: req.user.username}, function(err, doc){
        currentUser = doc;
        if(currentUser.managed_app){
            db.apps.findOne({_id: mongojs.ObjectId(currentUser.managed_app.id)}, function(err, doc){
                res.json(doc);
            });
        }
    });
});

// PUT Edit current user app
app.put('/app/:id', ensureAuthenticated, function(req,res){
    var id = req.params.id;

    // 画像の保存パス
    // /(public)/images/app/req.body.name_photo_file# + .png
    var path = '/images/app/';
    var imagesUploaded = {image: req.body.new_image, facebook_icon: req.body.new_facebook_icon};
    var imagePaths = {image: req.body.image, facebook_icon: req.body.facebook_icon};

    for(var imageFile in imagesUploaded) {
        if(imagesUploaded[imageFile]){
            imagePaths[imageFile] = path + uuid.v1().split('-').join('') + '_' + imageFile +'.png'; //一意的ファイル名を生成
      }
    }

    db.apps.findAndModify({query: {_id: mongojs.ObjectId(id)},
        update: {
            $set: {
                    name: req.body.name,
                    contact_information: req.body.contact_information,
                    about: req.body.about,
                    image: imagePaths.image,
                    facebook_icon: imagePaths.facebook_icon,
                    link_1: req.body.link_1,
                    link_1_name: req.body.link_1_name,
                    link_2: req.body.link_2,
                    link_2_name: req.body.link_2_name,
                    link_3: req.body.link_3,
                    link_3_name: req.body.link_3_name,
                    link_4: req.body.link_4,
                    link_4_name: req.body.link_4_name,
                    link_5: req.body.link_5,
                    link_5_name: req.body.link_5_name
            }
        },
        new: true}, function(err, doc){
            res.json(doc);
            // 各ファイルのアップロード処理
            // Base64型データの変換・/images/app/アプリ名_ファイル番号で保存
            // 全ての画像は[.png]で保存されます。
            for(var imageFile in imagesUploaded) {
                if(imagesUploaded[imageFile]){
                    imagesUploaded[imageFile] = imagesUploaded[imageFile].replace(/^data:image\/.*;base64,/, "");
                    fs.writeFile(__dirname + '/public' +
                        imagePaths[imageFile], new Buffer(imagesUploaded[imageFile], "base64"), function(err) {});
                }
            }
    });
});

app.listen(3000);
console.log("server running on port 3000");
