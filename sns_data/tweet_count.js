var Twitter = require('twitter');
var mongo = require("./mongodb.js");

var client = new Twitter({
  consumer_key: 'W1R7bE9OacUrYWgRJiii8a6nq',
  consumer_secret: 'LN3K2PJ2TLQlvHFYLVGN7FOkTAFCGmzdzYFjK39Sc893uBAN6E',
  access_token_key: '730652063940534272-4aImtdzMSLlGG9j6DzdSBYtRIhODmWr',
  access_token_secret: 'NjqAj2onGK0uCJzu0aVHQ62crjf9mPhzVPSXGjOicU9Wp'
});

function getTweets(params) {

  var endpoint = 'search/tweets';
  var tweetPromise = new Promise(function(resolve, reject) {

    // resolve the promise
    function tweetCallback(error, tweets, response) {
      if (error) {reject(error);}
      else {resolve(tweets);}
    }

    client.get(endpoint, params, tweetCallback);

  });

  return tweetPromise;

}

function findLowestTweetID(tweets) {

  function findSmallest(previousValue, currentValue, currentIndex, array) {
    return [previousValue.id_str, currentValue.id_str].sort()[0];
  }

  return tweets.statuses.reduce(findSmallest);

}

function countTweets(collectionName, keyword) {

  var params = {q: keyword, count: 100};
  var tweetTotal = 0;

  function endCount(error) {

    console.dir(error);
    console.log("Tweets counted: " + tweetTotal);

    // store count in db
    mongo.updateOne(mongo.dbURL, collectionName, {name: keyword}, {tweet_count: tweetTotal});

  }

  function count(tweets) {

    console.log(tweets.search_metadata.max_id_str);
    console.log(tweets.statuses[0].text);
    console.log(tweets.statuses[0].created_at);

    tweetTotal += tweets.statuses.length;
    params.max_id = findLowestTweetID(tweets);

    var milisecondsBetweenCalls = 5000;
    setTimeout(function(){getTweets(params).then(count).catch(endCount)}, milisecondsBetweenCalls);

  }

  var tweetPromise = getTweets(params).then(count).catch(console.dir);

}

// retrieve spot names
var collectionName = "spotlist";
var queryObject = {};
var params = {fields:{name:1, _id:0}};
var spotNamesPromise = mongo.findDocuments(mongo.dbURL, collectionName, queryObject, params);

spotNamesPromise.then(function(spotObjectList) {

  // turn array of objects into array of names
  var spotNamesList = spotObjectList.map(function(arg){return arg.name;});

  assert(spotNamesList.length > 0, "No spot names found!")

  // store tweet count for every spot name
  for (var i = 0; i < spotNamesList.length; i++) {countTweets(collectionName, spotNamesList[i]);}

});

spotNamesPromise.catch(console.dir);
