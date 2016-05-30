var FB = require("fb");
var mongo = require("./mongodb.js")

FB.extend({
  appId: '238495983194668',
  appSecret: '4f8b9299a9a433a36ec217965f8318eb'
});
FB.setAccessToken("238495983194668|Y_4MILBUn-tYpFneq5kdLCRojE4");

var endpoint = "/boninislands/posts?fields=id,message,created_time,full_picture";
var method = "get";
var options = {};

function callback(response) {
  if(!response || response.error) {
    console.log(!response ? 'error occurred' : response.error);
    return;
  }

  var collectionName = "rawFacebookData";
  var fieldToCompare = "id";
  mongo.storeUniqueData(response.data, mongo.dbURL, collectionName, fieldToCompare);
};

FB.api(endpoint, method, options, callback);
