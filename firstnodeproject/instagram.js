var https = require("https");
var mongo = require("./mongodb.js")

function request_callback(response) {
  response.setEncoding("utf-8");
  console.log(response.statusCode);
}

var url = "https://www.instagram.com/explore/tags/tokyotower/";

var request = https.get(url, request_callback);
var source = "";

function response_callback () {
  // referring to the variable request outside this scope
  if (request.res && request.res.readable) {

    source = request.res.read();

    var imageCodeRegex = /window._sharedData = (.*?);<\/script>/;

    var imageCode = source.match(imageCodeRegex);

    var imageData = JSON.parse(imageCode[1]);
    var recentNodes = imageData.entry_data.TagPage[0].tag.media.nodes;
    var popularNodes = imageData.entry_data.TagPage[0].tag.top_posts.nodes;

    var images = recentNodes.concat(popularNodes);

    mongo.storeDataInCollection(mongo.dbURL, "rawImageData", images);
  }
}

request.on("close", response_callback)
