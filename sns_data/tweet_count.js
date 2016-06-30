var Twitter = require('twitter');
var mongo = require("./mongodb.js");

var countLog = require("./simpleLog.js").makeLog("tweet_count.log");

function fixSpotName(name) {
  var result = name;
  /* the following two left parentheses are not the same.
     this function removes both kinds. */
  result = result.replace(/（.*/, "");
  result = result.replace(/\(.*/, "");
  if (result.length > 0) {return result;}
  else {return name};
}

function getTweets(client, params) {
  var endpoint = 'search/tweets';
  var tweetPromise = new Promise(function(resolve, reject) {

    // resolve the promise
    function tweetCallback(error, tweets, response) {
      if (error) {reject(error);}
      else {resolve(tweets);}
    }


    var message = "";
    message += "API call parameters:\n";
    message += endpoint + "\n";
    message += JSON.stringify(params) + "\n";
    message += "\n";

    countLog.writeToLog(message);

    client.get(endpoint, params, tweetCallback);

  });
  return tweetPromise;

}

function findLowestTweetID(tweets) {

  // i don't think this ever happens
  if (!tweets.statuses) {
    countLog.logError("tweets.statuses not present");
    return tweets.id_str;
  }

  // if only one tweet is returned
  if (tweets.statuses.length == 1) {
    return tweets.statuses[0].id_str;
  }

  function findSmallest(previousValue, currentValue, currentIndex, array) {
    return [previousValue.id_str, currentValue.id_str].sort()[0];
  }

  var result = tweets.statuses.reduce(findSmallest);
  return result;

}

// todo the error this used before is gone, now i need to stop the infinite loop
function endCount(client, collectionName, keyword, spotList) {

  countLog.writeToLog("Tweets counted: " + tweetTotal);

  // store count in db
  mongo.updateOne(mongo.dbURL, collectionName, {name: keyword}, {tweet_count: tweetTotal});
  tweetTotal = 0;
  delete params.max_id;

  spotList.shift();
  setTimeout(()=>{countTweets(client, collectionName, spotList)}, millisecondsBetweenCalls);

}

function countTweets(client, collectionName, spotList) {

  if (spotList.length == 0) {return countLog.writeToLog("All counts complete.");}

  keyword = spotList[0];
  params.q = fixSpotName(keyword);

  var tweetPromise = getTweets(client, params).then(count).catch(countLog.logError);

  function count(tweets) {

    // not sure if this is the best condition to use
    if (tweets.statuses.length <= 1) {return endCount(client, collectionName, keyword, spotList);}

    var message = "";
    message += "First tweet received from API call:\n";
    message += tweets.search_metadata.max_id_str + "\n";
    message += JSON.stringify(tweets.statuses[0].text) + "\n";
    message += tweets.statuses[0].created_at + "\n";

    countLog.writeToLog(message);

    tweetTotal += tweets.statuses.length;

    var lowestTweetID = findLowestTweetID(tweets);
    params.max_id = lowestTweetID;


    setTimeout(()=>{getTweets(client, params).then(count).catch(countLog.logError)}, millisecondsBetweenCalls);

  }

}

/* globals used by count and endCount functions. */
params = {q: "", count: 100};
tweetTotal = 0;
var millisecondsBetweenCalls = 5000;

function main(queryObject) {

  var client = new Twitter({
    consumer_key: 'W1R7bE9OacUrYWgRJiii8a6nq',
    consumer_secret: 'LN3K2PJ2TLQlvHFYLVGN7FOkTAFCGmzdzYFjK39Sc893uBAN6E',
    access_token_key: '730652063940534272-4aImtdzMSLlGG9j6DzdSBYtRIhODmWr',
    access_token_secret: 'NjqAj2onGK0uCJzu0aVHQ62crjf9mPhzVPSXGjOicU9Wp'
  });

  // retrieve spot names
  var collectionName = "spotlist";
  if (!queryObject) {queryObject = {};} // default to finding all documents
  var params = {fields:{name:1, _id:0}};
  var spotNamesPromise = mongo.findDocuments(mongo.dbURL, collectionName, queryObject, params);

  spotNamesPromise.then(function(spotObjectList) {

    // turn array of objects into array of names
    var spotNamesList = spotObjectList.map(function(arg){return arg.name;});

    if (!(spotNamesList.length > 0)) {return countLog.writeToLog("No spot names found!");}

    // store tweet count for every spot name
    countTweets(client, collectionName, spotNamesList);

  });

  spotNamesPromise.catch(countLog.logError);

}

if (require.main === module) {main({facebook_messages: {$size: 0}});}
else {module.exports.main = main;}
