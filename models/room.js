// Chat room model

var db = require('../database');
var _ = require('lodash');


var Room = db.orm.ephemeral.define('Room', {
	
	// school: {type: Number, dataType: 'int', null: false},  // todo: school ID if server handles multiple schools
	name: {type: String, length: 30, null: false, default:"unnamed"},
	maximumOccupancy: {type: Number, dataType: 'int', null: true},
	
	occupants: {type: [], null: false, default:[]}  // list of sessionIDs
		
});

Room.prototype.send = function(sender, message, transmit) {
	_.map(this.occupants, function(occupant){
		transmit(occupant, message);
	});
}

Room.prototype.enter = function(sender, message, transmit) {
	this.occupants.push({id:sender});
	console.log("Room " + this.name + " occupants: " + JSON.stringify(this.occupants) + " just added " + JSON.stringify(sender));
	this.send(sender, message, transmit);
}

/*
var RoomSession = db.orm.ephemeral.define('RoomUser', {
	sessionId: String;
});

Room.hasMany(RoomSession);
*/

module.exports = Room;
