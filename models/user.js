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


var User = db.sequelize.define('User', {
	nickname: {
		type: db.Sequelize.STRING(13),
		allowNull: false,
		defaultValue: "",
		unique: true,
		validate: {  //"[A-Za-z0-9 !@#$_%^&*()+;:'<>\/\?\-]"
			is: {args:[['^[a-zA-Z0-9\-\#\$\%\*\?\+\/\&\!\'\@\^\(\)\+\;\:\<\>\._ ]+$']], msg:"Illegal character in nickname"},
			not: {args:[['  ']], msg:"Nickname can't have two spaces in a row"},
			len: {args:[2,13], msg: "Nickname should be 2-13 letters long"}
		}
	},
	password: {
		type: db.Sequelize.STRING(60).BINARY,
		allowNull: false,
		validate: {
			len: {args:[6,60], msg: "Password should be 6-60 characters"}
		}
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
	points: {
		type: db.Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 0
	},
	
	email: {
		type: db.Sequelize.STRING,
		allowNull: false
	},
	
	pwResetSent: db.Sequelize.DATE,
	
	pwResetCode: db.Sequelize.STRING(60)

},


{	
	classMethods: {
		
		checkLogin: function(nickname, password, callback) {
			User.find({where:{nickname: nickname}}).complete(function(err, user) {
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
		
		// validateAvatar returns false if anything's wrong with avatar data
		validateAvatar: function(avatar) {
			if (!avatar) return false;
			if ((typeof avatar) != 'object') return false;
			
			//["face","skincolor","hairstyle","haircolor","uniform","uniformcolor","addons"]
			for (var p in ["face","skincolor","hairstyle","haircolor","uniform","uniformcolor"]) {
				if ((typeof avatar[p]) != 'number') return false;
				if (avatar[p] < 0 || avatar[p] >= config.number.of[p]) return false;
			}
			
			if (avatar.addons) {
				if (!Array.isArray(avatar.addons)) return false;
				for (var a in avatar.addons) {
					if ((typeof a) != 'number') return false;
				}
			}
			
			
			// it's ok i guess
			return true;
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
