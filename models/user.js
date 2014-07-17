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
		
		
		// check if nickname is legal and not used
		//   callback(err, status) - status is null for ok, 		
		//		or {error: 'validation', msg: "Validation reason"}
		//		or {error: 'taken', msg: "That nickname's already taken"
		checkNickname: function(nickname, callback) {
			if (typeof nickname !== "string") {
				if (callback) callback(null, {submitted:nickname, error:"validation", msg:"That's not a string"});
				return;
			}
			
			var temp = User.build({nickname: nickname, password:"placeholder"});
			var validation = temp.validate();
			if (validation) {
				// didn't pass validation - pick one error message to pass on to user
				var prop = Object.keys(validation)[0];
				if (callback) callback(null, {submitted:nickname, error:"validation", msg:validation[prop][0]});	
			}
			else {
				// check if exists
				User.find({where:{nickname: nickname}}).complete(function(err, user) {
					if (err && callback) callback(err);
					else {
						if (user) {
							if (callback) callback(null, {submitted:nickname, error: "taken", msg:"That nickname's already taken"});
						}
						else {
							if (callback) callback(null, null);
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
		}
		
		
	}
		
	
});

	

module.exports = User;
