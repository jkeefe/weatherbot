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

// Listen To Twitter Stream filtered for @DataNewsWeather
var stream = Bot.stream('statuses/filter', { track: ['@HiWeatherbot'] });

// If someone mentions @DataNewsWeather, jump into action
stream.on('tweet', function (tweet) {
  console.log(tweet);

	// Is the tweet directed at me? We'll know because the in_reply_to_user_id
	// will be *MY* user id, which is 2908555695.
	if (tweet.in_reply_to_user_id != 2908555695) {
		
		// in_reply_to_user_id doesn't match
		// Tweet not directed at me, just a mention
		var tweet_text = "@jkeefe Someone's tweeting about me. Might wanna check it out: http://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str;
		
		tweetThis(tweet_text, null);
		console.log("Just a mention.");


		} else {	
			
		// Tweet directed at me. Extract the location from the tweet text
		var location_text = extractLocation(tweet.text);
		console.log(location_text);
		
		// Detect other fun things, like "thank you"
		
		// Go forth and geocode that location
		geocoder.geocode(location_text, function(err, data) {
		
			if (err) {
				
				// log the error
				console.log(err);
			
			} else if (data.status == "ZERO_RESULTS") {
				
				// @reply that we couldn't find any results
				console.log("no location found.");
				var replyto = tweet.user.screen_name;
				var tweet_text = "@" + replyto + " Hi! I couldn't find a location based on your tweet to me. For a forecast, try again with a city name.";
				tweetThis(tweet_text, tweet.id_str);
				
			} else {
	
				// found a location! Pull out the lat/lon 
				var lat = data.results[0].geometry.location.lat;
				var lon = data.results[0].geometry.location.lng;
				console.log(lat,lon);
				
				// should we use celsius instead?
				

				// configure the request to forecast.io
				var options = {
					url: 'https://api.forecast.io/forecast/'+ keys.FORECAST_IO_API_KEY +'/' + lat + ',' + lon,
					method: 'GET'
				};
				
				// Start the request to forecast.io
				request(options, function (error, response, body) {
					
					if (error || response.statusCode != 200) {
						
						// Something went wrong getting forecast
						console.log(error);
						
					} else {
						
						// all good getting forecast
						var weather = JSON.parse(body);
						
						// make this data[0] if it's before 2pm local time
						// make this data[1] if it's after 2 p.m. local time
						var forecast = weather.daily.data[1];
						
						// pluck out the day of the week for the two days
						// and add them to the day objects
						
						// grab the forecast time, turn it into an EST (my local) moment object
						var time_calculation = moment.unix(forecast.time);
						
							// adjust the offset based on the one provided by forecast, 
							// so we are using times local to the forecast point.
							// ... need to take the inverse since moment assumes negative offset
							time_calculation = time_calculation.zone(-1 * weather.offset);
						
						// take the day of the week out of the forecast time (Sunday, Monday, Tuesday)
						var weekday = time_calculation.format("dddd");
						
						// build the components of the tweet
						var replyto = tweet.user.screen_name;
						var summary = forecast.summary;
						var high = Math.round(forecast.temperatureMax);
						var chance = Math.round(forecast.precipProbability * 100);
						var precip = forecast.precipType;
						var more = "http://forecast.io/#/f/" + lat.toPrecision(6) + "," + lon.toPrecision(6);
						var precip_text = "";
						
						// formulate precipitation repsonse if the chance is greater than 5%
						if (chance >= 5) {
							
							precip_text = "chance of " + precip + " " + chance + "%.";
							
						} else {
							
							precip_text = "with no precipitation likely.";
							
						}
						
						var tweet_text = "@" + replyto + " Hi! For " + weekday + ": " + summary + " High of " + high + "°F, " + precip_text + " " + more;
												
						console.log(tweet_text);
						
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
			
function tweetThis(text, id) {
	
	Bot.post('statuses/update', { 
		status: text,
		in_reply_to_status_id: id 
		}, function(err, data, response) {
			console.log(data);
	});
	
}