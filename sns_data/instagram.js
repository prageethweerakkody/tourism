var httpsPromise = require("./httpsPromise.js");
var mongo = require("./mongodb.js")
var dl = require("./downloadImage.js")
var instagramLog = require("./simpleLog.js").makeLog("instagram.log");


// grabs the page source and stores non-duplicate images in the database
function extractAndStoreImages (source, spot_id) {

  // get the raw image html
  var imageCodeRegex = /window._sharedData = (.*?);<\/script>/;

  var imageCode = source.match(imageCodeRegex);

  // make the raw image data usable
  var imageData = JSON.parse(imageCode[1]);
  var recentNodes = imageData.entry_data.TagPage[0].tag.media.nodes;
  var popularNodes = imageData.entry_data.TagPage[0].tag.top_posts.nodes;

  // list of all scraped image data
  var images = recentNodes.concat(popularNodes)
    // take out the videos (not 100% sure this works yet, untested)
    .filter(function(imageNode){return !imageNode.is_video});

  var collectionName = "rawImageData";
  var fieldToCompare = "id";
  var imageURLFieldName = "display_src";

  // store the images slowly so we don't overwhelm our 1gb of ram
  function storeInstagramImage(image) {

    image["spot_id"] = spot_id;
    image["approvalStatus"] = false;

    dl.downloadAndStoreImage(mongo.dbURL, collectionName, image, fieldToCompare, imageURLFieldName);
    instagramLog.writeToLog(image);

  }

  function processSlowly(list, callback, delay) {
    if (list.length == 0) {return true;}
    callback(list[0]);
    setTimeout(()=>{processSlowly(list.slice(1, list.length), callback, delay)}, delay);
  }

  processSlowly(images, storeInstagramImage, 5000);

}

// lets us pass the spot id into the callback
function makeImageExtractor(spot_id) {
  return (source)=>{extractAndStoreImages(source, spot_id)};
}

// grab the images and put them in the database
function main(queryObject) {

  if (queryObject) {instagramLog.writeToLog(queryObject);}
  else {instagramLog.writeToLog("Grabbing images for all spots.");}

  // retrieve instagram tag names
  var collectionName = "spotlist";
  if (!queryObject) {queryObject = {};}
  var instagramTagFieldName = "tag_instagram";
  // will work even if not all spots have instagram tag names
  if (!queryObject[instagramTagFieldName]) {
    queryObject[instagramTagFieldName] = {$exists: true, $ne: null}
  };

  // done this way so instagramTagFieldName can be changed easily from above if needed
  // i'm not aware of a nicer way to accomplish this without hardcoding the field name
  var params = {};
  params["fields"] = {};
  params["fields"][instagramTagFieldName] = 1;

  var spotNamesPromise = mongo.findDocuments(mongo.dbURL, collectionName, queryObject, params);

  spotNamesPromise.then((spotNamesList)=>{

      if (!(spotNamesList.length > 0)) {return instagramLog.logError("No spot names found!");}

      // hopefully instagram doesn't change this...
      var urlBase = "https://www.instagram.com/explore/tags/";

      for (var i = 0; i < spotNamesList.length; i++) {

        if (Array.isArray(spotNamesList[i][instagramTagFieldName])) {

          var instagramTagList = spotNamesList[i][instagramTagFieldName];
          for (var tagIndex = 0; tagIndex < instagramTagList.length; tagIndex++) {
            var fullSpotURL = urlBase + encodeURIComponent(instagramTagList[tagIndex]) + "/";
            httpsPromise.getRequestPromise(fullSpotURL, "utf-8")
              .then(makeImageExtractor(spotNamesList[i]["_id"]))
              .catch(instagramLog.logError);
          }

        } else {
          // make one request for every spot name
          var fullSpotURL = urlBase + encodeURIComponent(spotNamesList[i][instagramTagFieldName]) + "/";
          httpsPromise.getRequestPromise(fullSpotURL, "utf-8")
            .then(makeImageExtractor(spotNamesList[i]["_id"]))
            .catch(instagramLog.logError);

        }

      }

    }

  );

  spotNamesPromise.catch(instagramLog.logError);

}

if (require.main === module) {main();}
else {module.exports.main = main;}
