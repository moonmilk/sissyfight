/* 
	User model
*/
var db = require('../database');

// bcrypt for hashing passwords
var bcrypt = require('bcrypt');

// text model to get password reset email text
var text = require('./text');
// hashids to generate password reset codes
var Hashids = require("hashids"),
    hashids = new Hashids("playgroundgames");
// whiskers for email templates
var whiskers = require('whiskers');
// nodemailer to send email
var config = require('../config');
var nodemailer = require('nodemailer'),
	mailtransport = config.email ? nodemailer.createTransport(config.email.transport) : null;
var _ = require('lodash');


var User = db.sequelize.define('User', {
	nickname: {
		type: db.Sequelize.STRING(13),
		allowNull: false,
		defaultValue: "",
		unique: true,
		validate: {  //"[A-Za-z0-9 !@#$_%^&*()+;:'<>\/\?\-]"
			is: {args:[['^[a-zA-Z0-9\-\#\$\%\*\?\+\/\&\!\'\@\^\(\)\+\;\:\<\>\.\~_ ]+$']], msg:"Illegal character in nickname"},
			not: {args:[['  ']], msg:"Nickname can't have two spaces in a row"},
			len: {args:[2,13], msg: "Nickname should be 2-13 letters long"}
		}
	},
	password: {
		type: db.Sequelize.STRING(60).BINARY,
		allowNull: true // unclaimed reserved accounts would have null password
	},
	
	avatar:	{
		type: db.Sequelize.TEXT,
		get: function() {
			var a = this.getDataValue('avatar');
			if (a.length) return JSON.parse(a);
			else return {};
		},
		set: function(v) {
			if (typeof v === "string") this.setDataValue('avatar', v);
			else this.setDataValue('avatar', JSON.stringify(v));
		},
		allowNull: false,
		defaultValue: "{}"
	},
	
	lastPlayed: db.Sequelize.DATE,

	// scoring ---------------
	month_points: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	month_games: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	month_wins: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	month_wins_solo: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},

	alltime_points: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	alltime_games: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	alltime_wins: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	alltime_wins_solo: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},

	
	
	// contact and password reset --------
	email: {
		type: db.Sequelize.STRING,
		allowNull: false
	},
	
	pwResetSent: db.Sequelize.DATE,
	
	pwResetCode: db.Sequelize.STRING(60),
	
	level: db.Sequelize.INTEGER

},


{	
	classMethods: {
		
		checkLogin: function(nickname, password, callback) {
			User.find({where:[{nickname: nickname}, "password is not null"]}).complete(function(err, user) {
				if (err) callback(err);
				else if (!user) callback(null, null);
				else {
					bcrypt.compare(password, user.password, function(err, passwordMatch) {
						if (err) callback(err);
						else {
							if (passwordMatch) callback(null, user);
							else callback(null, null);
						}
					});
				}
			});
		},
		
		
		// check if nickname is legal and not used. If email is not null, checks it is unused as well.
		//   callback(err, status) - status is null for ok, 		
		//		or {error: 'validation', msg: "Validation reason"}
		//		or {error: 'taken', msg: "That nickname's already taken"
		checkNicknameAndEmail: function(nickname, email, callback) {
			if (typeof nickname !== "string") {
				callback(null, {submitted:nickname, error:"validation", msg:"That's not a string"});
				return;
			}
			
			var temp = User.build({nickname: nickname, password:"placeholder"});
			var validation = temp.validate();
			if (validation) {
				// didn't pass validation - pick one error message to pass on to user
				var prop = Object.keys(validation)[0];
				//console.log(validation);
				callback(null, {submitted:nickname, error:"validation", msg:validation[prop][0]});	
			}
			else {
				// check if exists
				User.find({where:{nickname: nickname}}).complete(function(err, user) {
					if (err) callback(err);
					else {
						if (user) {
							callback(null, {submitted:nickname, error: "taken", msg:"That nickname's already taken"});
						}
						else if (email) {
							User.find({where:{email: email}}).complete(function(err, user) {
								if (err) callback(err);
								else if (user) {
									callback(null, {submitted:email, error:"taken", msg:"That e-mail address is already in use."});
								}
								else callback(null, null); // neither nickname nor email matched.
							});
						}
						else {
							// not checking email, and nickname was ok, so return success
	 						callback(null, null);
	 					}
					}
				})
			}
		},
		
		
		createUser: function(userdata, callback) {
			bcrypt.hash(userdata.password, 8, function(err, hash) {
				if (err) {
					console.log("User.createUser: trouble creating hash: " + err);
					if (callback) callback(err);
				}
				else {
					userdata.password = hash;
					User.create(userdata).complete(callback);
				}
			});				
		},
		
		
		recordScore: function(userID, points, win, solo) {
			console.log('user.recordScore: ', arguments); // #### PLACEHOLDER!
		},
		
		
		// validateAvatar returns null if avatar is ok, or error description otherwise
		validateAvatar: function(avatar, level) {
			if (!avatar) return "no avatar";
			if ((typeof avatar) != 'object') return "not an object";
			
			//["face","skincolor","hairstyle","haircolor","uniform","uniformcolor","addons"]
			var props = ["face","skincolor","hairstyle","haircolor","uniform","uniformcolor"];
			for (var i=0; i<props.length; props++) {
				var p = props[i];
				//console.log('prop ' + p + " value " + avatar[p] + " max " + config.avatar.number.of[p]);
				if ((typeof avatar[p]) != 'number') return (p + " not a number: " + avatar[p]);
				if ((avatar[p] < 0) || (avatar[p] >= config.avatar.number.of[p])) return (p + " out of range: " + avatar[p]);
			}
			
			if (avatar.addons) {
				// figure out allowed addons by level
				var maxTier = 0, custom = 0;
				if (level <= 1) maxTier = 0;
				else if (level <= 3) maxTier = 1;
				else if (level <= 4) maxTier = 2;
				else if (level <= 6) maxTier = 3;
				else if (level <= 400) maxTier = 3;
				if (level >= 401 && level <= 499) {
					maxTier = 3;
					custom = level;
				}
				else if (level >= 500) {
					maxTier = 5;
				}
		
				if (!Array.isArray(avatar.addons)) return "addons not array";
				if (avatar.addons.length > 3) return "too many addons";
				for (var i=0; i<avatar.addons.length; i++) {
					var a = avatar.addons[i];
					if ((typeof a) != 'number') return ("addon id not a number: " + a);
					else {
						var addonInfo = _.find(config.avatar.addons, {id: a});
						if (!addonInfo) return ("no such addon id: " + a); // no such addon
						else if (addonInfo.tier < 0) return ("addon tier negative: " + a); // negative addons for dressing room mirror only
						else if (addonInfo.tier > maxTier) {	// custom avatars for their owners only
							if (custom==0 || addonInfo.id != custom) return ("addon " + a + " above tier for level " + level + ": tier " + addonInfo.tier);
						}
					}
				}
				
				// todo: check for addon conflicts
			}
			
			
			// it's ok i guess
			return null;
		},
		
		
		// send email with password reset code
		//	callback(err) - err is null for success
		requestPasswordResetEmail: function(nickname, email, callback) {
			// look up user by nickname and email
			User.find({where: [{nickname:nickname}, {email:email}]}).complete(function(err, user) {
				if (err) callback(err);
				else {
					if (user) {
						var secondsSinceLastRequest = (new Date()-user.pwResetSent) / 1000;
						
						// if they just recently hit the button, give a success response but don't email again
						if (secondsSinceLastRequest < 120) {
							callback();
						}
						// if it's been more than a few minutes but less than 12 hours - 
						else if (secondsSinceLastRequest < 12 * 60 * 60) {
							//callback("You asked for a reset email not long ago - try again later.");
							//ignore:
							callback();
						}
						else {	
							// generate recovery code
							var code = hashids.encrypt(new Date().getMilliseconds() + Math.floor(Math.random()*10000000));
							text.retrieve('pwreset-email-%', function(err, texts) {
								if (err) callback(err);
								else {
									
									if (!mailtransport) callback("Oops, can't send email now");
									else {
										var emailContent = {
											from: 		texts['pwreset-email-from'],
											to: 		email,
											subject: 	texts['pwreset-email-subject'],
											text:		whiskers.render(texts['pwreset-email-text'], { code: code, nickname: nickname })
										}
										// send mail! not monitoring callback for now, crossing fingers and assuming it works
										mailtransport.sendMail(emailContent, function(err, info) {
											if (err) console.log("nodemailer error", err);
											else console.log("nodemailer success", info);
										});
									
										// update user record with new code
										user.pwResetSent = new Date();
										user.pwResetCode = code;
										user.save().complete(function(err) {
											if (err) callback(err);
											else callback();
										});	
									}								
								}
							});
						}
					}
					else {
						callback("Couldn't find that name and email.");
					}
				}
			});
		},
		
		
		// reset user's password by email and reset code
		//	callback(err, nickname) - if success, returns affected user's nickname
		resetPassword: function(email, code, newpassword, callback) {
			// hash the password
			bcrypt.hash(newpassword, 8, function(err, hash) {
				if (err) callback(err);
				else {
					// sequelize doesn't return # of rows affected by raw query update
					// so have to do two queries.
					var now = new Date();
					
					db.sequelize.query(
						'SELECT id, nickname FROM Users ' +  // , (TIME_TO_SEC(TIMEDIFF(:now, pwResetSent))) as secs
						'WHERE email=:email AND pwResetCode=:code AND (TIME_TO_SEC(TIMEDIFF(:now, pwResetSent))) < :daysecs ',
						
						null,
						
						{ raw: true }, 
						
						{ email:email, code:code, now:now, daysecs: 24*60*60 }	
					).complete(function(err, result) {
						if (err) {
							console.log("Password reset for " + email + " failed with db error " + err);
							callback(err);
						}
						else if (result.length==0) {
							callback("Wrong email, or reset link's too old");
						}
						else if (result.length > 1) {
							console.log("Password reset trouble! More than one match for email and code! ", email, code);
							callback("Something went wrong.");
						}
						else {
							// only one result, or something's REALLY weird
							// update user's password 
							var id = result[0].id, nickname = result[0].nickname;
						
							db.sequelize.query(
								'UPDATE Users SET password=:hashedpassword, pwResetSent=NULL ' +
								'WHERE id=:id ' +
								'LIMIT 1 ' ,
								
								null,
								
								{ raw: true },
								
								{ id: id, hashedpassword: hash }
							
							).complete(function(err, result) {
								if (err) callback(err);
								else callback(null, nickname);
							})	
								
							
						}
					});
									
				}
			});

		}
		
		
	}
		
	
});

	

module.exports = User;
