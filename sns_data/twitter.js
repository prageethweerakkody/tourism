var Twitter = require('twitter');
var mongo = require("./mongodb.js");
var twitterLog = require("./simpleLog.js").makeLog("twitter.log");

function fixSpotName(name) {
  var result = name;
  /* the following two left parentheses are not the same.
     this function removes both kinds. */
  result = result.replace(/（.*/, "");
  result = result.replace(/\(.*/, "");
  if (result.length > 0) {return result;}
  else {return name};
}

function processSlowly(list, callback, delay) {
  if (list.length == 0) {return true;}
  callback(list[0]);
  setTimeout(()=>{processSlowly(list.slice(1, list.length), callback, delay)}, delay);
}

// grab the tweets and put them in the database
function main(queryObject) {

  var client = new Twitter({
    consumer_key: 'W1R7bE9OacUrYWgRJiii8a6nq',
    consumer_secret: 'LN3K2PJ2TLQlvHFYLVGN7FOkTAFCGmzdzYFjK39Sc893uBAN6E',
    access_token_key: '730652063940534272-4aImtdzMSLlGG9j6DzdSBYtRIhODmWr',
    access_token_secret: 'NjqAj2onGK0uCJzu0aVHQ62crjf9mPhzVPSXGjOicU9Wp'
  });

  var endpoint = 'search/tweets';

  // retrieve spot names
  var collectionName = "spotlist";
  if (!queryObject) {queryObject = {};}
  // will work even if not all spots have names
  // (not sure why that would ever happen, but better safe than sorry)
  if (!queryObject.name) {queryObject.name = {$exists: true, $ne: null}};
  var params = {fields:{name:1}};
  var spotNamesPromise = mongo.findDocuments(mongo.dbURL, collectionName, queryObject, params);

  spotNamesPromise.then(function(spotObjectList) {

    if (!(spotObjectList.length > 0)) {return twitterLog.logError("No spot names found!");}

    // store tweets for every spot name
    function getTweetsForSpot(spot) {

      spot.name = fixSpotName(spot.name);

      var params = {q: spot.name + " OR #" + spot.name, count: 100};

      // store the unique tweets
      function storeTweets(error, tweets, response, spot_id) {

        if (!error) {

          var collectionName = "rawTweetData";
          var fieldToCompare = "id_str";

          // set tweet spot ids
          tweets.statuses.map((arg)=>{arg["spot_id"] = spot_id; return arg;});

          // set approval status to false
          tweets.statuses.map((arg)=>{arg["approvalStatus"] = false; return arg;});

          mongo.storeUniqueData(tweets.statuses, mongo.dbURL, collectionName, fieldToCompare)
            .then(twitterLog.writeToLog)
            .catch(twitterLog.logError);

        }

        else {twitterLog.logError(error);}

      }

      function makeTweetStorer(spot_id) {
        return (error, tweets, response)=>{storeTweets(error, tweets, response, spot_id);};
      }

      // get the tweets and store them once obtained
      client.get(endpoint, params, makeTweetStorer(spot["_id"]));

    }

    processSlowly(spotObjectList, getTweetsForSpot, 5000);

  });

  spotNamesPromise.catch(twitterLog.logError);

}

if (require.main === module) {main();}
else {module.exports.main = main;}
