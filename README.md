weatherbot
==========

A Twitter bot that replies with a forecast.

See it in action by Tweeting at [@HiWeatherbot](http://twitter.com/HiWeatherbot) with a location.

This is an experiment in building a mildly useful Twitter bot and juggling a bunch of APIs. It runs using [Node.js](http://nodejs.org/) and uses the following node modules to make it all happen:

- [Twit](https://github.com/ttezel/twit)
- [Moment.js](http://momentjs.com/)
- [Geocoder](https://www.npmjs.com/package/node-geocoder)
- [Request](https://www.npmjs.com/package/request)

It also requires Twitter API keys and OAUTH tokens you can get by logging into your Twitter account and going to the Apps page for your account at [https://apps.twitter.com/](https://apps.twitter.com/).

And by "your" Twitter account I mean an account you control. I wouldn't recommend doing this on your valuable personal account, as it's possible to accidentally run afoul of the Twitter API rules ... which could lock up the account.

I run this using the node module [forever](https://www.npmjs.com/package/forever) with the following command: 

	sudo forever start -a -m 1 -l /home/ubuntu/bothouse/weatherbot/log.txt weatherbot.js
	
-m 1 means it won't restart more than 1 time, preventing twitter rate-limit problems. 
-l [path] is the place to save the log.
-a appends to the log.





