/* 
	Text model - for storing boilerplate text like homepage announcements, email content, etc.
*/
var db = require('../database');


var Text = db.sequelize.define('Text', {
	
	key: {
		type: db.Sequelize.STRING(60),
		allowNull: false,
		unique: true
	},
	
	text: {
		type: db.Sequelize.TEXT,
		allowNull: false
	},
	
	// cache time to live in seconds
	// NOT YET IMPLEMENTED
	cache_ttl: {
		type: db.Sequelize.INTEGER,
		allowNull: true
	}
	
	
	
}, 

{
	classMethods: {
		
		// retrieve: quick and dirty lookup of one or more texts: can use sql wildcard to match multiple keys.
		//	callback(err, texts)
		//		e.g. retrieve('pwreset-email-%') -> {pwreset-email-text: "", pwreset-email-subject: "", pwreset-email-from: ""}
		retrieve: function(keys, callback) {
			Text.findAll({where:["`key` like ?", keys]}).complete(function(err, records) {
				if (err) callback(err);
				else {
					var texts = {};
					if (records && records.length) records.forEach(function(record) {
						texts[record.key] = record.text;
					})
					callback(null, texts);
				}
			});
		}
		
	}
		
});


module.exports = Text;