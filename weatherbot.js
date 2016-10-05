var Twit = require('twit'),
	geocoder = require('geocoder'),
	request = require('request'),
	moment = require('moment'),
	keys = require('../api_keys/weatherbot_keys');

var Bot = new Twit({
    consumer_key:         keys.TWITTER_CONSUMER_KEY,
	consumer_secret:      keys.TWITTER_CONSUMER_SECRET,
	access_token:         keys.TWITTER_ACCESS_TOKEN,
	access_token_secret:  keys.TWITTER_ACCESS_TOKEN_SECRET
});

// Listen To Twitter Stream filtered for @HiWeatherbot
var stream = Bot.stream('statuses/filter', { track: ['@HiWeatherbot'] });

stream.on('error', function (error) {
	// Log the error
	console.log("Weatherbot error: ", error);
});

stream.on('limit', function(limitMessage){
  	console.log("Weatherbot limit problem: ",limitMessage);
});

stream.on('disconnect', function (disconnectMessage) {
  	console.log("Weatherbot disconnect issue: ",disconnectMessage);
});

stream.on('reconnect', function (request, response, connectInterval) {
	console.log("Reconnect issue. Reconnecting in:", connectInterval + "ms");
	console.log("Reconnect Request: " + request);
	console.log("Reconnect Response: " + response);
});

// If someone mentions @HiWeatherbot, jump into action
stream.on('tweet', function (tweet) {

	// First, making sure the tweet is not directed at me --
	// needs to be a directed message with @hiweatherbot, not just a mention.
    // We can know because the in_reply_to_user_id isn't me (2908555695)
 	if (tweet.in_reply_to_user_id != 2908555695) {
		
		// in_reply_to_user_id doesn't match
		// Tweet not directed at me, just a mention
		// Log it (might also do something like Slack it)
		
		var log_text = "Weatherbot note: Someone's tweeting about me. http://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str;
		console.log(log_text);
		
		} else {	
		
		console.log("---");
		console.log("Weeatherbot tweet received:", tweet.text);
		
		// Tweet directed at me! Extract the location from the tweet text
		var location_text = extractLocation(tweet.text);
		
		// TODO: Detect other fun things, like "thank you" and "hello"
		
		// TODO: Detect a blank tweet, which messes up the geocoder code
		
		// Go forth and geocode that location
		geocoder.geocode(location_text, function(err, data) {
		
			var replyto = tweet.user.screen_name;
			var tweet_text;
		
			if (err) {
				
				// @reply about the geocode fail
				tweet_text = "@" + replyto + " Hi! Something went wrong with my geocoding system, so I can't get you a forecast. Sorry! cc @jkeefe";
				tweetThis(tweet_text, tweet.id_str);
				
				// log the error
				console.log("Geocode error: ", err);
			
			} else if (data.status == "ZERO_RESULTS") {
				
				// @reply that we couldn't find any results
				tweet_text = "@" + replyto + " Hi! I couldn't find a location based on your tweet to me. For a forecast, try again with a city name.";
				tweetThis(tweet_text, tweet.id_str);
				console.log("Geocode Zero Results");
				
			} else {
				
				console.log("Successful geocode.");
	
				// found a location! Pull out the lat/lon 
				var lat = data.results[0].geometry.location.lat;
				var lon = data.results[0].geometry.location.lng;
				
				// grab the name of the locality for the tweet
				var locality = getLocality(data.results[0].address_components);
				
				// should we use celsius instead?
				var country = getCountry(data.results[0].address_components);
				var farenheit_countries = ["US", "BS", "BZ", "KY", "PW", "AS", "VI"];
				var included = farenheit_countries.indexOf(country);
				var use_celsius = false;
				
				if (included == -1 ) {
					// our country is not in the list
					use_celsius = true;
				}

				// configure the request to darksky.net
				var options = {
					url: 'https://api.darksky.net/forecast/'+ keys.FORECAST_IO_API_KEY +'/' + lat + ',' + lon,
					method: 'GET'
				};
				
				// Start the request to api.darksky.net
				request(options, function (error, response, body) {
					
					if (error || response.statusCode != 200) {
						
						// Something went wrong getting forecast
						// @reply about that
						tweet_text = "@" + replyto + " Hi! Something went wrong getting your forcast. I'm sorry! cc @jkeefe";
						tweetThis(tweet_text, tweet.id_str);

						// log the error
						console.log("Forecast fetching error: ", error);
						
					} else {
						
						console.log("Successful forecast fetch.");
						
						// all good getting forecast
						var weather = JSON.parse(body);
						
						// What time is it!?!
						// Here current_local_time will be set to the time at the forecast location
						var current_local_time = moment.unix(weather.currently.time);
						
							// adjust the offset based on the one provided by forecast, 
							// so we are using times local to the forecast point.
							// ... need to take the inverse since moment assumes negative offset
							current_local_time = current_local_time.zone(-1 * weather.offset);
							
						// use today's forecast data[0] if it's before noon local time
						// use tomorrow's forecast data[1] if it's after noonlocal time
						var forecast;
						
						if (current_local_time.hour() < 12) {
							forecast = weather.daily.data[0];
						} else {
							forecast = weather.daily.data[1];
						}
						
						// grab the forecast time, turn it into an unix moment object
						var forecast_time = moment.unix(forecast.time);
						
							// adjust the offset based on the one provided by forecast, 
							// again, using times local to the forecast point.
							// ... need to take the inverse since moment assumes negative offset
							forecast_time = forecast_time.zone(-1 * weather.offset);
						
						// build the components of the tweet ...
						
						// if the forecast day of the week and the current day of the week are the same,
						// call the forecast "today." Otherwise use the day of the week for the forecast.
						var forecast_day;
						if (forecast_time.day() == current_local_time.day()) {
							forecast_day = "today";
						} else {
							// take the day of the week out of the forecast time (Sunday, Monday, Tuesday)
							forecast_day = forecast_time.format("dddd");
						}
						
						var summary = forecast.summary;
						var high = "";
						
							if (use_celsius === true) {
								
								var temp = (forecast.temperatureMax - 32) * 5 / 9;
								high = Math.round(temp).toString(10) + "°C";
								
							} else {
								
								high = Math.round(forecast.temperatureMax).toString(10) + "°F";
								
							}
						
						var chance = Math.round(forecast.precipProbability * 100);
						var precip = forecast.precipType;
						var more = "http://darksky.net/" + lat.toPrecision(6) + "," + lon.toPrecision(6);
						var precip_text = "";
						
						// show precipitation repsonse if the chance is greater than 0%
						if (chance > 0) {
							
							precip_text = "chance of " + precip + " " + chance + "%.";
							
						} else {
							
							precip_text = "with no precipitation likely.";
							
						}
						
						tweet_text = "@" + replyto + " Hi! " + locality + " " + forecast_day + ": " + summary + " High of " + high + ", " + precip_text;
						
						// make sure it's not more than 140 characters
						tweet_text = tweet_text.substring(0,140);
						
						// if there's room, add on the api.darksky.net url
						// this is based on the current t.co length (22) from 140 (118) and a space (117)
						// more info here: https://dev.twitter.com/overview/t.co
						if (tweet_text.length <= 117) {
							tweet_text = tweet_text + " " + more;
						}
												
						console.log("Tweet sent:", tweet_text);
						
						//Turn off tweets here if testing locally
						tweetThis(tweet_text, tweet.id_str);
						
					}
					
				});
	
			}
				
		});
		
	}
	
});


function extractLocation(text) {
	
	// This function cleans up the tweet's text to distill it into a location, if it can
	
	// Take any @mentions out of the text
	var location = text.replace(/@\S+/g, '');
	
	// Now take any #hashtags out, too
	location = location.replace(/#\S+/g, '');
	
	// Eventually also remove links
	
	return location;
}

// extract country short name (e.g. GB for Great Britain) from google geocode API result
function getCountry(addrComponents) {
    for (var i = 0; i < addrComponents.length; i++) {
        if (addrComponents[i].types[0] == "country") {
            return addrComponents[i].short_name;
        }
    }
    return false;
}

// extract locality (e.g. Minneapolis) from google geocode API result
function getLocality(addrComponents) {
    for (var i = 0; i < addrComponents.length; i++) {
        if (addrComponents[i].types[1] == "sublocality") {
            return addrComponents[i].long_name;
        } else if (addrComponents[i].types[0] == "locality") {
			return addrComponents[i].short_name;
		}
    }
    // This replaces a blank locality in the tweet. So instead of "Minneapolis Friday"
	// tweet will say "For Friday"
    return "For";
}

// the tweeting function			
function tweetThis(text, id) {
	
	Bot.post('statuses/update', { 
		status: text,
		in_reply_to_status_id: id 
		}, function(err, data, response) {
			/// console.log(data);
	});
	
}