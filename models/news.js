var mongoClient = require('mongodb').MongoClient;

var constants = require('../lib/constants.js');

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
  if (err) throw err;
  console.log('Connected to MongoDB server at: ' + connection_string);
  db = mongoDB; // Make reference to db globally available.
});

exports.store = function() {
  db.collection('world-news')
    .updateMany(
      { date: 'today' },
      { $set: { 'news': exports.fromToday }},
      { upsert: true },
      // Callback upon error or success
      function(err, status) {
        if (err) console.log(err);
        // console.log(status);
      }
    );
};

exports.retrieveNewsFromToday = function(callback) {
  db.collection('world-news')
    .find({ date: 'today' })
    .toArray(function(err, docs) {
      callback(docs[0].news)
    })
}

exports.extractCitiesFromNews = function(worldNews) {
  return Object.keys(worldNews)
  .map(function(country) {
    var newsForCountry = worldNews[country]
    newsForCountry = Object.keys(worldNews[country]).map(function(city) {
      return worldNews[country][city];
    })
    return newsForCountry;
  })
  .reduce(function(prev, curr) {
    return prev.concat(curr);
  }, []);
}

exports.extractNewsForCountry = function(worldNews, country) {
  if (!worldNews[country]) { console.log('No world news for ' + country); return []; }
  return Object.keys(worldNews[country])
  .map(function(city) {
    return worldNews[country][city].news;
  })
  .reduce(function(prev, curr) {
    return prev.concat(curr)
  }, [])
}

exports.fromToday = {}

