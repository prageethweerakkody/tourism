// for resizing
var lwip = require("lwip");
var httpsPromise = require("./httpsPromise.js");

// for finding the file type
var https = require('https');
var imageType = require('image-type');

function imageTypePromise(url) {

  var typePromise = new Promise((resolve, reject)=>{

    https.get(url, (res)=>{
    	res.once('data', function (chunk) {
    		res.destroy();
    		resolve(imageType(chunk));
    	});
    }).on("error", (e)=>{reject(e);});

  });

  return typePromise;

}

function openImagePromise(source, type) {

  var imagePromise = new Promise((resolve, reject)=>{

      lwip.open(source, type, (err, image)=>{
        if (err) {reject(err);}
        else {resolve(image);}
      });

    }

  );

  return imagePromise;

}

function resizeImagePromise(image, width, height) {

  var imagePromise = new Promise((resolve, reject)=>{

    image.resize(width, height, (err, image)=>{
      if (err) {reject(err);}
      else {resolve(image);}
    });

  });

  return imagePromise;

}

// possible to automate writing promise versions of functions?
function imageBufferPromise(image, format, params) {

  var bufferPromise = new Promise((resolve, reject)=>{

    image.toBuffer(format, params, (err, image)=>{
      if (err) {reject(err);}
      else {resolve(image);}
    });

  });

  return bufferPromise;

}

// get the width and height an image should be based on its current size.
function findResizedDimensions(oldWidth, oldHeight) {

  var newWidth;
  var newHeight;

  // hard coded, not sure where else it makes sense to put our image size needs
  var maxWidth = 1080;

  if (oldWidth <= maxWidth) {
    newWidth = oldWidth;
    newHeight = oldHeight;
  } else { // if the image is too wide
    // shrink to our max width, adjusting height to preserve the aspect ratio
    newWidth = maxWidth;
    newHeight = Math.round(oldHeight * (maxWidth / oldWidth));
  }

  return {width: newWidth, height: newHeight};

}

function resizedImagePromise(url, format) {

  var resizedImagePromise = new Promise((resolve, reject)=>{

    // get image from url
    var imageRequest = httpsPromise.getRequestPromise(url, "base64");

    imageRequest.then((base64String)=>{

      var buff = new Buffer(base64String, "base64");
      var imagePromise = openImagePromise(buff, format.ext);
      imagePromise.then((image)=>{

        // resize the image
        var newDimensions = findResizedDimensions(image.width(), image.height());
        resizeImagePromise(image, newDimensions.width, newDimensions.height)
          .then((image)=>{

            console.log("New width: " + image.width());
            console.log("New height: " + image.height());

            // output format hardcoded as png for now
            var imageBuffer = imageBufferPromise(image, "jpg", {quality: 50})
              .then((buff)=>{resolve(buff);})
              .catch(reject);

          })
          .catch(reject);

      });
      imagePromise.catch(reject);

    });

    imageRequest.catch(reject);

  });

  return resizedImagePromise;

}

module.exports.resizedImagePromise = resizedImagePromise;
module.exports.imageTypePromise = imageTypePromise;
