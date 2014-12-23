weatherbot
==========

A twitter bot that replies with a forecast.

I run this with 

	sudo forever start -m 3 -o outfile.txt -l log.txt weatherbot.js
	
which means it won't restart more than 3 times, preventing twitter rate-limit problems.



