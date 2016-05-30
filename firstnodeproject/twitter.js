var Twitter = require('twitter')
var mongo = require("./mongodb.js")

var client = new Twitter({
  consumer_key: 'W1R7bE9OacUrYWgRJiii8a6nq',
  consumer_secret: 'LN3K2PJ2TLQlvHFYLVGN7FOkTAFCGmzdzYFjK39Sc893uBAN6E',
  access_token_key: '730652063940534272-4aImtdzMSLlGG9j6DzdSBYtRIhODmWr',
  access_token_secret: 'NjqAj2onGK0uCJzu0aVHQ62crjf9mPhzVPSXGjOicU9Wp'
});

var endpoint = 'search/tweets';

var params = {q: '東京タワー'};

function callback(error, tweets, response) {
  if (!error) {
    console.log(tweets);
    // using tweets.statuses instead of just tweets leaves out an id
    // that comes back with the response. don't think we need it right now. 
    mongo.storeDataInCollection(mongo.dbURL, "rawTweetData", tweets.statuses);
  }
}

client.get(endpoint, params, callback);
