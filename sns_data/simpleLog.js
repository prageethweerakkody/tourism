var fs = require("fs");

function logError(logFileName, error) {
  if (error) {
    if (typeof error == "object") {error = JSON.stringify(error);}
    error = new Date().toString() + "\n" + error;
    fs.appendFile(logFileName, "Error: " + error + "\n", console.dir);
  }
}

function writeToLog(logFileName, message) {
  if (typeof message == "object") {message = JSON.stringify(message);}
  message = new Date().toString() + "\n" + message;
  fs.appendFile(logFileName, message + "\n", logError);
}

function makeLog(logFileName) {
  return {
    logError: (error)=>{logError(logFileName, error)},
    writeToLog: (message)=>{writeToLog(logFileName, message)}
  };
}

module.exports.makeLog = makeLog;
