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