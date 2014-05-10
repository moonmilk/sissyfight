/* 
	User model
*/
var db = require('../database');
var bcrypt = require('bcrypt');


var User = db.sequelize.define('User', {
	nickname: {
		type: db.Sequelize.STRING(13),
		allowNull: false,
		defaultValue: "",
		unique: true,
		validate: {
			is: ['[a-zA-Z0-9\-\#\$\%\*\?\+\/\&\!\' ]'],
			len: {args:[3,15], msg: "Nickname should be 3–15 letters long"}

			/* something seems to hang up if i use custom validator functions - return to this another time
			,
			trimmed: function(nickname) {
				if (nickname.match(/(^\s+|\s+$)/)) throw new Error("Nickname can't start or end with spaces");
			},
			repeats: function(nickname) {
				if (nickname.match(/(''|  )/)) throw new Error("Nickname can't have repeated spaces or apostrophes");
			}
			*/
		}
	},
	password: {
		type: db.Sequelize.STRING(60).BINARY,
		allowNull: false
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
	}
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
		
		
		createUser: function(userdata, callback) {
			bcrypt.hash(userdata.password, 8, function(err, hash) {
				if (err) {
					console.log("User.createUser: trouble creating hash: " + err);
					callback(err);
				}
				else {
					userdata.password = hash;
					User.create(userdata).complete(callback);
				}
			});				
		}
		
		
	}
		
	
});

	

module.exports = User;