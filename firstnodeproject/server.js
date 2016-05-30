var express = require('express');
var app = express();
var mongojs = require('mongojs');
var db = mongojs('spotlist', ['spotlist','rawImageData']);
var bodyParser = require('body-parser');


app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.get('/spotlist', function(req, res){
	console.log("get request");

	db.spotlist.find(function (err, docs){
		console.log("get docs");
		res.json(docs);

	});

});

app.get('/rawImageData', function(req, res){

	db.rawImageData.find(function (err, docs){
		console.log("get docs");
		res.json(docs);
	});

});

app.get('/rawTweetData', function(req, res){

	db.rawTweetData.find(function (err, docs){
		console.log("rawTweetData");
		res.json(docs);
	});

});


app.post('/spotlist', function(req, res){
	console.log(req.body);
		db.spotlist.insert(req.body, function(err, doc){
			res.json(doc);
	});
});

app.delete('/spotlist/:id', function(req, res){
	var id = req.params.id;
	console.log(id);
	db.spotlist.remove({_id: mongojs.ObjectId(id)}, function(err, doc){
		res.json(doc);
	});
});

app.get('/spotlist/:id', function(req,res){
	var id = req.params.id;
	console.log(id);
	db.spotlist.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
		res.json(doc);
	});
});

app.put('/spotlist/:id', function(req,res){
	var id = req.params.id;
	db.spotlist.findAndModify({query: {_id: mongojs.ObjectId(id)}, 
		update: {$set: {name: req.body.name, location: req.body.location, date: req.body.date, description_japanese: req.body.description_japanese, description_english:req.body.description_english, description_chinese:req.body.description_chinese, description_korean:req.body.description_korean, comment_japanese:req.body.comment_japanese, comment_english:req.body.comment_english, comment_chinese:req.body.comment_chinese, comment_korean:req.body.comment_korean, photo1:req.body.photo1, photo2:req.body.photo2, photo3:req.body.photo3, photo4:req.body.photo4, photo5:req.body.photo5,photo6:req.body.photo6, facebook1:req.body.facebook1, facebook2:req.body.facebook2, facebook3:req.body.facebook3, facebook4:req.body.facebook4, facebook5:req.body.facebook5}},
		new: true}, function(err, doc){
			res.json(doc);
	});
});

app.listen(3000);
console.log("server running on port 3000");