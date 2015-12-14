var CountryAnalytics = require("../models/country-analytics.js");
var News = require("../models/news.js");

exports.init = function(app) {
  app.get('/', index);
  app.get('/news/:country', getCountryNews);
  app.get('/cities', getCities);
  app.get('/analytics', getAnalytics);
};

var index = function(req, res) {
  res.render('index', { title: 'World Map News' });
};

// We get country news when we click on a country on the map
// Country news sends a JSON object with all news for that country 
// which we then use to update the news control 
var getCountryNews = function(req, res) {
  var country = req.params.country;
  console.log(country);

  // Track country views to get analytics later
  CountryAnalytics.update(country, function(message) { console.log(message); });

  News.retrieveNewsFromToday(function(worldNews) {
    // In this call we only care to get the news for a particular country so extract
    // news for that country from world news
    res.send( JSON.stringify( News.extractNewsForCountry(worldNews, country) ) );
  });
};

// When we first load the page we also want to load all cities
// so we can indicate where news is happening 
var getCities = function(req, res) {
  News.retrieveNewsFromToday(function(worldNews) {
    // In this call we only care to get city data such as city name, 
    // coordinates, and city occurences so extract such data from world news 
    res.send(News.extractCitiesFromNews(worldNews));
  }); 
}

var getAnalytics = function(req, res) {
  CountryAnalytics.retrieve(function(analytics) {
    res.render('analytics', { title: 'Analytics', analytics: analytics })
  })
}
