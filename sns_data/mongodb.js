var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var dbURL = "mongodb://localhost:27017/spotlist";
var mongoLog = require("./simpleLog.js").makeLog("mongo.log");

function storeDataInCollection(url, collectionName, data) {

  var storageResultPromise = new Promise((resolve, reject)=>{

    function storeData(err, db) {

      if(err) {reject(err);}

      db.createCollection(collectionName, function(err, collection) {});

      var rawDataCollection = db.collection(collectionName);

      rawDataCollection.insert(data, {w:1}, function(err, result) {

        if (err) {reject(err);}
        else {resolve(result);}

        db.close();

      });

    }

    MongoClient.connect(url, storeData);

  });

  return storageResultPromise;

}

function findDocuments(url, collectionName, queryObject, queryParameters) {

  var promise = new Promise(function(resolve, reject) {

    function findDocs(err, db) {

      if(err) {return mongoLog.logError(err);}

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

  var storageResultPromise = new Promise((resolve, reject)=>{

    // allow calling the function with a single object instead of an array of them
    if (!Array.isArray(currentList)) {currentList = [currentList];}

    if (!(currentList.length > 0)) {reject(new Error("No data to store!"));}

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
        resolve(storeDataInCollection(dbURL, collectionName, filteredData));
      }
      else {
        reject("Data is already stored: " + collectionName + " " + fieldToCompare + " " + String(filteredData));
      }

    });

    IDListPromise.catch(reject);

  });

  return storageResultPromise;

}

function updateOne(dbURL, collectionName, queryObject, updateDataObject) {

  function performUpdate(err, db) {

    if (err) {return mongoLog.logError(err);}

    var collection = db.collection(collectionName);
    collection.updateOne(queryObject, {$set: updateDataObject}, function(err, result) {

      db.close();

      if (err) {mongoLog.logError(err);}
      else {
        mongoLog.writeToLog(result);
      }

    });

  }

  MongoClient.connect(dbURL, performUpdate);

}

module.exports.storeDataInCollection = storeDataInCollection;
module.exports.dbURL = dbURL;
module.exports.findDocuments = findDocuments;
module.exports.storeUniqueData = storeUniqueData;
module.exports.updateOne = updateOne;
module.exports.ObjectId = mongo.ObjectId;
