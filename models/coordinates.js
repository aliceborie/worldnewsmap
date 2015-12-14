var constants = require('../lib/constants.js');
var mongoClient = require("mongodb").MongoClient;

var db_name = 'world'

// For mongo db running locally
var connection_string = 'localhost:27017/' + db_name;

// For mongodb in openshift
if(process.env.OPENSHIFT_MONGODB_DB_URL){
  mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + db_name;
}

// Global variable of the connected database
var db; 

// Use connect method to connect to the MongoDB server
mongoClient.connect('mongodb://' + connection_string, function(err, mongoDB) {
  if (err) console.log(err);
  console.log("Connected to MongoDB server at: " + connection_string);
  db = mongoDB; // Make reference to db globally available.
});

exports.retrieve = function(cities, country, news, callback, routesCallback) {
  var countryCode = constants.CODES_BY_COUNTRY[country];
  if (!countryCode) return;

  db.collection("cities")
    .find({ "City": { $in: cities }, 'Country': countryCode.toLowerCase() })
    .toArray(function(err, docs) {
      console.log('Finished find from mongo for ' + country);
      if (err) console.log(err);
      callback(news, country, docs, routesCallback);
    });
};

