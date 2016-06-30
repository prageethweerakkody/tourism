var mongo = require("./mongodb.js");
var resize = require("./resize.js");
var fs = require("fs");

// determine which collection and document to add the image data to
function makeUpdateFunction(dbURL, collectionName, imageObject, fieldToCompare, imageURLFieldName) {

  return function(buff) {

    // store image data in mongodb
    mongo.storeUniqueData(imageObject, dbURL, collectionName, fieldToCompare)
      .then((result)=>{

        // there should only be one in the array
        var uniqueID = result.insertedIds[0];

        var fileName = "/images/sns/" + uniqueID + ".jpg";
        fs.writeFile(__dirname + "/../webApi/public" + fileName, buff, {}, console.dir);

        var fbSpotUpdateObject = {
          photo_file1: fileName,
          facebook_images: [fileName],
          top_image: fileName
        };

        var fbSpotQueryObject = {id: imageObject.id};

        if (imageURLFieldName == "full_picture") {
          mongo.updateOne(dbURL, "spotlist", fbSpotQueryObject, fbSpotUpdateObject);
        }

        var fileNameFieldName = imageURLFieldName + "_local";
        // to make sure we don't overwrite anything
        if (!(imageObject[fileNameFieldName] == undefined)) {return console.error("Field name " + fileNameFieldName + " is already in use!");}
        var queryObject = {_id: mongo.ObjectId(uniqueID)};
        var updateObject = {};
        updateObject[fileNameFieldName] = fileName;

        mongo.updateOne(dbURL, collectionName, queryObject, updateObject);

      })
      .catch(console.dir);

  };

}

function downloadAndStoreImage(dbURL, collectionName, imageObject, fieldToCompare, imageURLFieldName) {

  var updateFunction = makeUpdateFunction(mongo.dbURL, collectionName, imageObject, fieldToCompare, imageURLFieldName);

  resize.imageTypePromise(imageObject[imageURLFieldName])
    .then((imageType)=>{

      // really this should be done after we confirm that the image isn't
      // already stored in the database, but the way the code is right now
      // that's more difficult, and the code runs fast enough as is for now.
      resize.resizedImagePromise(imageObject[imageURLFieldName], imageType)
        .then(updateFunction)
        .catch(console.dir);

    })
    .catch(console.dir);

}

module.exports.downloadAndStoreImage = downloadAndStoreImage;
