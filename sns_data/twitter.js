var Twitter = require('twitter');
var mongo = require("./mongodb.js");

var client = new Twitter({
  consumer_key: 'W1R7bE9OacUrYWgRJiii8a6nq',
  consumer_secret: 'LN3K2PJ2TLQlvHFYLVGN7FOkTAFCGmzdzYFjK39Sc893uBAN6E',
  access_token_key: '730652063940534272-4aImtdzMSLlGG9j6DzdSBYtRIhODmWr',
  access_token_secret: 'NjqAj2onGK0uCJzu0aVHQ62crjf9mPhzVPSXGjOicU9Wp'
});

var endpoint = 'search/tweets';

// retrieve spot names
var collectionName = "spotlist";
var queryObject = {};
var params = {fields:{name:1, _id:0}};
var spotNamesPromise = mongo.findDocuments(mongo.dbURL, collectionName, queryObject, params);

spotNamesPromise.then(function(spotObjectList) {

  // turn array of objects into array of names
  var spotNamesList = spotObjectList.map(function(arg){return arg.name;});

  // store tweets for every spot name
  for (var i = 0; i < spotNamesList.length; i++) {

    var params = {q: spotNamesList[i]};

    // store the unique tweets
    function storeTweets(error, tweets, response) {

      if (!error) {

        var collectionName = "rawTweetData";
        var fieldToCompare = "id_str";

        mongo.storeUniqueData(tweets.statuses, mongo.dbURL, collectionName, fieldToCompare);

      }

      else {console.dir(error);}

    }

    // get the tweets and store them once obtained
    client.get(endpoint, params, storeTweets);

  }

});

spotNamesPromise.catch(console.dir);
