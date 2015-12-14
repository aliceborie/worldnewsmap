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
  if (err) doError(err);
  console.log("Connected to MongoDB server at: " + connection_string);
  db = mongoDB; // Make reference to db globally available.
});

exports.update = function(country, callback) {
  db.collection("countries")
    .updateMany(
      { country: country },
      { $inc: { "viewed": 1 }},
      { upsert: true },
      // Callback upon error or success
      function(err, status) {
        if (err) console.log(err);
        var message = status.modifiedCount
          ? 'Updated view count of ' + country + ' by 1.'
          : 'Added ' + country + '.';
        callback(message);
      }
    );
};

exports.retrieve = function(callback) {
  db.collection("countries")
    .find()
    .toArray(function(err,docs) {
      if (err) {console.log(err); return;}
      callback(docs.map(function(doc) { 
        return { name: doc.country, viewed: doc.viewed } 
      }));
    });
}
