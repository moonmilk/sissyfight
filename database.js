/*
	database: set up the Sequelize and JugglingDB ORMs
	...will get rid of Sequelize when I get around to converting existing Sequelize dependents
	Juggling doesn't support connection pooling yet, so might let sequelize stick around for a while.
*/



var Sequelize = require('sequelize');
var sissyfight_db_str = process.env.SISSYFIGHT_DB;  // dialect|hostname|database name|username|password
if (!sissyfight_db_str) console.log("Missing environment variable SISSYFIGHT_SQL");
var sissyfight_db = sissyfight_db_str.split('|');

var sequelize = new Sequelize(sissyfight_db[2], sissyfight_db[3], sissyfight_db[4], {
	host: sissyfight_db[1],
    dialect: sissyfight_db[0],
    //logging: false
});


exports.Sequelize = Sequelize;
exports.sequelize = sequelize;


var Schema = require('jugglingdb').Schema;
var jugglingRedis = new Schema('redis', {port: 6379});


// if i move User records to juggling, they will go under juggling.persistent
var juggling = {ephemeral: jugglingRedis};


exports.orm = juggling;

