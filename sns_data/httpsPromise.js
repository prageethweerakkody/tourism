var https = require("https");

function makeProcessResponse(updateFunction, encoding) {

  return function(response) {

    response.setEncoding(encoding);
    console.log(response.statusCode);

    var rawData = "";

    response.on("data", function(data){rawData += data;});

    response.on("end", function(){updateFunction(rawData)});

  };

}

function getRequestPromise(url, encoding) {

  var httpsPromise = new Promise((resolve, reject)=>{

    https.get(url, makeProcessResponse(resolve, encoding)).on('error', (e)=>{reject(e);});

  });

  return httpsPromise;

}

module.exports.getRequestPromise = getRequestPromise;
