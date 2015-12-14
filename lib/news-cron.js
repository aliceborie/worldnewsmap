require('dotenv').load();
var async = require('async');
var request = require('request');
var constants = require('./constants.js');
var Scrubber = require('../services/newsScrubber.js');
var News = require('../models/news.js')

var WEBHOSE_SOURCES = ['cnn.com', 'reuters.com', 'newyorker.com', 'un.org', 'yahoo.com', 'nytimes.com', 'foxnews.com', 'dailymail.co.uk', 'nydailynews.com', 'abc7.com', 'washingtonpost.com', 'huffingtonpost.com', 'washingtonexaminer.com'];

var retrieve = function(country, cb) {
  var reqURL = constants.WEBHOSE_BASE_URL
                + '/search'
                + '?q=location:' + country
                + '&token=' + constants.WEBHOSE_API_KEY
                + '&site=' + WEBHOSE_SOURCES.join('&site=')
                + '&format=json'
                + '&site_type=news';
  var reqOpts = { url: reqURL, json: true };

  request.get(reqOpts, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb('Could not retrieve news from webhose for ' + country);
    return cb(null, country, body.posts);
  });
};

var format = function(country, posts, cb) {
  Scrubber.doScrub(posts, country, function(posts, cities) {
    console.log("Done scrubbing for " + country + " total posts: \n", posts.length);
    cb(null, country, posts, cities);
  });
};

var store = function(country, posts, cities, cb) {
  console.log('Starting store for ' + country + ' for:\n ' + posts.length + ' total posts');
  console.log(cities);
  // Store news in current day's news object
  News.fromToday[country] = cities;
  News.store();
  cb(null, country);
};


var getNewsForCountry = function(country, cb) {
  async.waterfall([
      function(cb) { cb(null, country); },
      retrieve,
      format,
      store
    ],
    function(err, country) { 
      console.log(err || 'Success for country ' + country); 
      if (err) { cb(null, country + ' failed because: \n ' + err); return;}
      cb(null, 'Success for country ' + country) // Callback for async map 
    }
  );
};

var done = function(err, result) { 
  if (err) { 
    console.log(err); 
    process.exit(1); // Exit with failure
  }
  console.log('Success retrieving, formating, and storing news for ' + result.length + ' countries!'); 
  process.exit(0); // Exit with success 
}

async.map(
  constants.COUNTRIES, // TODO remove slice
  getNewsForCountry,
  done
);
