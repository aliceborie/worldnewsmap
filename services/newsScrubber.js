var request = require('request');
var async = require('async');
var constants = require('../lib/constants.js');
var coordinates = require('../models/coordinates.js');

exports.doScrub = function(webhoseNews, country, callback) {
  var news = keepPostsWithLocation(webhoseNews);
  console.log(country + ' Scrub 1: ' + news.length);
  news = keepRelevantFieldsFromPosts(news);
  console.log(country + ' Scrub 2: ' + news.length);
  var cityOccurences = getCityOccurencesFromNews(news)
  var cities = Object.keys(cityOccurences);
  coordinates.retrieve(cities, country, news, keepPostsWithCitiesInCountry, callback)
}

// Scrub 1
var keepPostsWithLocation = function(webhoseNews) {
  return webhoseNews.filter(function(post) { return post.locations.length > 0; });
};

// Scrub 2
var keepRelevantFieldsFromPosts = function(webhoseNews) {
  var applyBlacklist = function(location) {
    return (typeof location === 'string'
            && constants.LOCATIONS_BLACKLIST.indexOf(location) === -1);
  };

  return webhoseNews
    .map(function(post) {
      return {
        url: post.url,
        source: post.thread.site,
        title: post.title,
        text: post.text,
        language: post.language,
        locations: post.locations,
        cities: post.locations.filter(applyBlacklist)
      };
    })
    .filter(function(post) {
      return post.cities.length > 0 // Only want posts with cities
              && post.text.length > 1000 // Only want medium-sized posts
              && post.text.length < 5000
              && post.text.search('</div>') === -1; // Don't want any posts with HTML
    });
};

// Scrub 3f
var keepPostsWithCitiesInCountry = function(webhoseNews,country,citiesData,callback) {
  var posts = [] // posts to keep
  webhoseNews.forEach(function(post) {
    var citiesInCountry = {};
    post.cities.forEach(function(city) {
      city = city.toLowerCase();
      var cityData = isInCountry(city);
      if (cityData) {
        var city = {
          name: cityData.AccentCity,
          lat: cityData.Latitude,
          lng: cityData.Longitude
        }
        citiesInCountry[city.name] = city
      }
    })
    post.cities = citiesInCountry;
    if (Object.keys(post.cities).length) {
      // Only want posts with news from cities in country
      posts.push(post)
    }
  })

  // var cities = getCityOccurencesFromNewsWithData(posts)

  // Routes callback to update view
  // callback(posts, cities)
  // summarizePostText(posts,cities,callback)
  console.log(country + ' Scrub 3: ' + posts.length);
  summarizePostText(posts,country,callback)

  function isInCountry(city) {
    for (i=0;i<citiesData.length;i++) {
      var cityInCountry = citiesData[i]
      if (cityInCountry.City == city) {
        return cityInCountry
      }
    }
    return false
  }
}

// Scrub 4
var summarizePostText = function(webhoseNews, country, callback) {
  console.log('Starting Scrub 4 for ' + country);

  var reqOpts = {
    url: constants.TEXTANALYSIS_BASE_URL,
    json: true,
    // Add our API Key
    headers: { 'X-Mashape-Key': constants.TEXTANALYSIS_API_KEY },
    // We want 3 sentence summaries
    form: { 'sentnum': 3 }
  };

  var getSummarizedPost = function(post, cb) {
    var opts = reqOpts;
    opts.form.text = post.text;
    request.post(opts, function(err, res, body) {
      var summarizedPost = post;
      if (body['sentences']) {
        summarizedPost.text = body['sentences'].join(' ');
      } else {
        summarizedPost.text = "Couldn't summarize news article. Read from source."
      }
      cb(null, summarizedPost);
    });
  };

  var done = function(err, summarizedPosts) {
    if (err) { console.log(err); return; }
    console.log(country + ' Scrub 4: ' + summarizedPosts.length);
    callback(summarizedPosts, summarizeCities(summarizedPosts));
  };

  // Summarize each post, and then do callback once all posts have been summarized
  async.map(
    webhoseNews,
    getSummarizedPost,
    done
  );
};

var getCityOccurencesFromNews = function(news) {
  var cityOccurences = {};
  news.forEach(function(post) {
    post.cities.forEach(function(city) {
      city = city.toString().toLowerCase();
      if (city in cityOccurences) {
        cityOccurences[city] = cityOccurences[city] + 1;
      } else {
        cityOccurences[city] = 1;
      }
    })
  })
  return cityOccurences
}

var summarizeCities = function(news) {
  var cityOccurences = {};
  news.forEach(function(post) {
    var citiesForPost = Object.keys(post.cities);
    citiesForPost.forEach(function(city) {
      city = post.cities[city]
      if (city.name in cityOccurences) {
        cityOccurences[city.name].occurences = cityOccurences[city.name].occurences + 1;
        cityOccurences[city.name].news.push(post)
      } else {
        cityOccurences[city.name] = {
          occurences: 1,
          news: [post],
          lat: city.lat,
          lng: city.lng,
          name: city.name
        }
      }
    })
  })
  return cityOccurences
}

