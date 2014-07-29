/*
	config: place where all the configuration stuff should go eventually.
*/


// email credentials: SISSYFIGHT_MAILER=service|user|password
//		service is one of nodemailer's Known Services - if we switch to a service not in their list, this variable will have to change
var email_info_str = process.env.SISSYFIGHT_MAILER;
if (!email_info_str) {
	console.log("Missing environment variable SISSYFIGHT_MAILER");
	exports.email = null;
}
else {
	var email_info = email_info_str.split('|');

	exports.email = {
		transport: {
			service: email_info[0],
			auth: {
				user: email_info[1],
				pass: email_info[2]
			}
		}
	}
	
}


exports.schools = {
	
	// names for rooms the server will create if all existing rooms are full
	roomNames: {
		'666': 'Sacrifice Altar, My Dark Master, Lockdown, Surveillance, No Fun For You, Tattoo Corner, Will to Survive, Sissy Fortress, Visiting Hours, Exercise Period, The Pentagram, Witchcraft 101, Curses!, Unholy Glee, HellfireClub, The Pit, Deadly Seven, Fangs R Us'.split(/,\s*/),
		'franklin': 'Chem Lab, Janitor\'s Closet, Third Bathroom, Boiler Room, Chess Club, Broken Window, Back Door, Pizza Shop, Dead Cat, Detox, Instant A, Math is Hard!, High Achievers, Copy This!, Burnt Toast'.split(/,\s*/),
		'angel': 'Aww Gee Whiz!, Snugglebumpkins, Fuzzy Things, Nice Dress!, Cheerleading, I Luv Ponies, Teddy Bears, Happy Flowers, Who\'s Richer?, Gossip, Boys Are Icky, Popularity 101, Pep Squad, Good Clean Fun, Pretty Rainbows, BMW Bike Club, Straight A Club, Smile Every Day'.split(/,\s*/),
		'suzy': 'Aww Gee Whiz!, Snugglebumpkins, Fuzzy Things, Nice Dress!, Cheerleading, I Luv Ponies, Teddy Bears, Happy Flowers, Who\'s Richer?, Gossip, Boys Are Icky, Popularity 101, Pep Squad, Good Clean Fun, Pretty Rainbows, BMW Bike Club, Straight A Club, Smile Every Day'.split(/,\s*/),
	}
	
}