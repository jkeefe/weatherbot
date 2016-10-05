# Weatherbot

![HiWeatherbot](images/hiweatherbot.png)

A Twitter bot that replies with a forecast.

<blockquote class="twitter-tweet" data-conversation="none" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/jkeefe">@jkeefe</a> Hi! Miami Wednesday: Rain throughout the day and breezy starting in the evening. High of 89°F, chance of rain 62%.</p>&mdash; Hi Weatherbot! (@HiWeatherbot) <a href="https://twitter.com/HiWeatherbot/status/783471432395358209">October 5, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

See it in action by Tweeting at [@HiWeatherbot](http://twitter.com/HiWeatherbot) with a location.

This is an experiment in building a mildly useful Twitter bot and juggling a bunch of APIs -- including the fabulous [darksky.net API](https://darksky.net/dev/).

And as an experiment, it's been known to fail. At one point, it even went into a crazy loop tweeting at itself (until Twitter wisely put an end to that). If it's not running, feel free to prod me into waking it up by dropping me a note at john (at) johnkeefe (dot) net.

##Node

The program runs in [Node](http://nodejs.org/) and uses the following node modules to make it all happen:

- [Twit](https://github.com/ttezel/twit)
- [Moment.js](http://momentjs.com/)
- [Geocoder](https://www.npmjs.com/package/node-geocoder)
- [Request](https://www.npmjs.com/package/request)

##Keys

It also requires Twitter API keys and OAUTH tokens you can get by logging into your Twitter account and going to the Apps page for your account at [https://apps.twitter.com/](https://apps.twitter.com/).

And by "your" Twitter account I mean an account you control. I wouldn't recommend doing this on your valuable personal account, as it's possible to accidentally run afoul of the Twitter API rules ... which could lock up the account.

The keys, along with an API key from [darksky.net](https://darksky.net/dev/), are stored in a file called `weatherbot_keys.js` in a directory outside the weatherbot folder -- mainly so I didn't accidentally include them here. They are brought in with an include statement near the top of the 'weatherbot.js' file. 

The structure of 'weatherbot_keys.js' is like this:

	var TWITTER_CONSUMER_KEY = 'your_consumer_key_goes_here',
		TWITTER_CONSUMER_SECRET = 'your_consumer_secret_goes_here',
		TWITTER_ACCESS_TOKEN = 'your_access_token_goes_here',
		TWITTER_ACCESS_TOKEN_SECRET = 'your_access_token_secret_goes_here',
		FORECAST_IO_API_KEY = 'your_forecast_io_key_goes_here';
	
		module.exports.TWITTER_CONSUMER_KEY = TWITTER_CONSUMER_KEY;
		module.exports.TWITTER_CONSUMER_SECRET = TWITTER_CONSUMER_SECRET;
		module.exports.TWITTER_ACCESS_TOKEN = TWITTER_ACCESS_TOKEN;
		module.exports.TWITTER_ACCESS_TOKEN_SECRET = TWITTER_ACCESS_TOKEN_SECRET;
		module.exports.FORECAST_IO_API_KEY = FORECAST_IO_API_KEY;

Darksky.net used to be forecast.io, hence the `FORECAST_IO_API_KEY` key name.

##Running

I run this using the node module [forever](https://www.npmjs.com/package/forever) with the following command: 

	sudo forever start -a -m 1 -l /home/ubuntu/bothouse/weatherbot/log.txt weatherbot.js
	
-m 1 means it won't restart more than 1 time, preventing twitter rate-limit problems. 
-l [path] is the place to save the log.
-a appends to the log.





