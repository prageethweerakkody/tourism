var https = require("https");
var mongo = require("./mongodb.js")

function processRequest(response) {

  response.setEncoding("utf-8");
  console.log(response.statusCode);

  var source = "";

  response.on("data", function(data){source += data;});

  response.on("end", function(){extractAndStoreImages(source)});

}

// retrieve spot names
var collectionName = "spotlist";
var queryObject = {};
var params = {fields:{tag_instagram:1, _id:0}};

var spotNamesPromise = mongo.findDocuments(mongo.dbURL, collectionName, queryObject, params);

spotNamesPromise.then(

  function(spotNamesList) {

    assert(spotNamesList.length > 0, "No spot names found!")

    // hopefully instagram doesn't change this...
    var urlBase = "https://www.instagram.com/explore/tags/";

    for (var i = 0; i < spotNamesList.length; i++) {

      // make one request for every spot name
      // if the spot names are not tags in instagram, the requests will fail
      var fullSpotURL = urlBase + encodeURIComponent(spotNamesList[i].name) + "/";
      https.get(fullSpotURL, processRequest);

    }

  }

);

spotNamesPromise.catch(console.dir);

// grabs the page source and stores non-duplicate images in the database
function extractAndStoreImages (source) {

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

  // store only the unique images
  mongo.storeUniqueData(images, mongo.dbURL, collectionName, fieldToCompare);

}
