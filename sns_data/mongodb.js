var MongoClient = require('mongodb').MongoClient;

var dbURL = "mongodb://localhost:27017/spotlist";

function storeDataInCollection(url, collectionName, data) {

  function storeData(err, db) {

    if(err) {return console.dir(err);}

    db.createCollection(collectionName, function(err, collection) {});

    var rawDataCollection = db.collection(collectionName);

    rawDataCollection.insert(data, {w:1}, function(err, result) {

      if (err) {return console.dir(err);}
      else {console.log(result);}

      db.close();

    });

  }

  MongoClient.connect(url, storeData);

}

function findDocuments(url, collectionName, queryObject, queryParameters) {

  var promise = new Promise(function(resolve, reject) {

    function findDocs(err, db) {

      if(err) {return console.dir(err);}

      var collection = db.collection(collectionName);

      collection.find(queryObject, queryParameters).toArray(function(err, docs) {

        db.close();

        if (err) {reject(err);}
        else {resolve(docs);}

      });

    }

    MongoClient.connect(url, findDocs);

  });

  return promise;

}

function storeUniqueData(currentList, dbURL, collectionName, fieldToCompare) {

  var params = {_id: 0};
  params[fieldToCompare] = 1;

  var IDListPromise = findDocuments(dbURL, collectionName, {}, params);

  IDListPromise.then(function(IDObjectList) {

    var IDList = IDObjectList.map(function(arg){return arg[fieldToCompare];});
    var filteredData = [];

    for (var i = 0; i < currentList.length; i++) {
      if (IDList.indexOf(currentList[i][fieldToCompare]) == -1) {
        filteredData.push(currentList[i]);
      }
    }

    if (filteredData.length > 0) {
      storeDataInCollection(dbURL, collectionName, filteredData);
    }
    else {
      console.log("All data is already stored.")
    }

  });

  IDListPromise.catch(console.dir);

}

function updateOne(dbURL, collectionName, queryObject, updateDataObject) {

  function performUpdate(err, db) {

    if (err) {return console.dir(err);}

    var collection = db.collection(collectionName);
    collection.updateOne(queryObject, {$set: updateDataObject}, function(err, result) {

      db.close();

      if (err) {console.dir(err);}
      else {console.log(result);}

    });

  }

  MongoClient.connect(dbURL, performUpdate);

}

module.exports.storeDataInCollection = storeDataInCollection;
module.exports.dbURL = dbURL;
module.exports.findDocuments = findDocuments;
module.exports.storeUniqueData = storeUniqueData;
module.exports.updateOne = updateOne;
