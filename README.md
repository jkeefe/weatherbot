weatherbot
==========

A twitter bot that replies with a forecast.

I run this with 

	sudo forever start -m 1 -l /home/ubuntu/bothouse/weatherbot/log.txt weatherbot.js
	
which means it won't restart more than 1 time, preventing twitter rate-limit problems.



