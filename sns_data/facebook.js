var FB = require("fb");
var mongo = require("./mongodb.js");
var dl = require("./downloadImage.js");
var httpsPromise = require("./httpsPromise.js");
var facebookLog = require("./simpleLog.js").makeLog("facebook.log");

function facebookRequestPromise(endpoint, method, options) {

  var facebookPromise = new Promise((resolve, reject)=>{

    FB.api(endpoint, method, options, (response)=>{

      if(!response || response.error) {
        reject(!response ? 'error occurred' : response.error);
      } else {resolve(response);}

    });

  });

  return facebookPromise;

}

function processFacebookResponse(response, user_info) {

  var collectionName = "rawFacebookData";
  var fieldToCompare = "id";
  var imageURLFieldName = "full_picture";

  // store the images slowly to not overload the 1gb of ram we get
  function storeFBImage(fbData) {

    fbData["spot_id"] = user_info["_id"];
    fbData["approvalStatus"] = false;

    // this needs to run only after the spot has been added
    function makeDownloadImageCallback(fbData, dbURL, collectionName, fieldToCompare, imageURLFieldName) {
      return (response)=>{
        // if the post has an image
        if (fbData[imageURLFieldName] != undefined) {
          dl.downloadAndStoreImage(dbURL, collectionName, fbData, fieldToCompare, imageURLFieldName);
        } else {
          mongo.storeUniqueData(fbData, dbURL, collectionName, fieldToCompare);
        }
      }
    }

    var newSpot = {

      id: fbData.id,
      name: fbData.message.slice(0, 20) + "-" + fbData.id,
      date: fbData.created_time.slice(0, 10).replace(/-/g, "/"),
      facebook_messages: [fbData.message],
      app: {
        id: user_info.managed_app.id,
        name: user_info.managed_app.name
      },
      // these are updated later if the relevant data exists
      tweet_count: 0,
      photo_file1: null,
      facebook_images: null,
      top_image: null,

    };

    mongo.storeUniqueData(newSpot, mongo.dbURL, "spotlist", "id")
      .then(makeDownloadImageCallback(fbData, mongo.dbURL, collectionName, fieldToCompare, imageURLFieldName))
      .then(facebookLog.writeToLog)
      .catch(facebookLog.logError);

  }

  function processSlowly(list, callback, delay) {
    if (list.length == 0) {return true;}
    callback(list[0]);
    setTimeout(()=>{processSlowly(list.slice(1, list.length), callback, delay)}, delay);
  }

  processSlowly(response.data, storeFBImage, 5000);

};

/* not really sure if this is the best way to get the spot
   name into the api callback. oh well, at least it works. */
function makeFacebookRequestProcessor(user_info) {
  return (response)=>{processFacebookResponse(response, user_info);};
}

// grab the facebook data and store it in the database
function main(queryObject) {

  FB.extend({
    appId: '238495983194668',
    appSecret: '4f8b9299a9a433a36ec217965f8318eb'
  });
  FB.setAccessToken("238495983194668|Y_4MILBUn-tYpFneq5kdLCRojE4");

  var collectionName = "users";
  if (!queryObject) {queryObject = {};}
  // will work even if not all users have a facebook_url field
  if (!queryObject.facebook_url) {queryObject.facebook_url = {$exists: true, $ne: null}};
  var params = {fields:{facebook_url:1, managed_app: 1}};
  var spotNamesPromise = mongo.findDocuments(mongo.dbURL, collectionName, queryObject, params);

  spotNamesPromise.then(function(spotObjectList) {

    // turn array of objects into array of names
    // also cut off the part we don't need
    spotObjectList = spotObjectList.map(function(arg) {
      arg.facebook_url = arg.facebook_url.replace("https://www.facebook.com/", "");
      return arg;
    });

    if (!(spotObjectList.length > 0)) {return facebookLog.logError("No spot names found!");}

    for (var i = 0; i < spotObjectList.length; i++) {

      var endpoint = "/" + spotObjectList[i].facebook_url + "/posts?fields=id,message,created_time,full_picture";
      var method = "get";
      var options = {};



      facebookRequestPromise(endpoint, method, options)
        .then(makeFacebookRequestProcessor(spotObjectList[i]))
        .catch(facebookLog.logError);

    }

  });

  spotNamesPromise.catch(facebookLog.logError);

}

if (require.main === module) {main();}
else {module.exports.main = main;}
