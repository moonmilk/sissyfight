// Homeroom extends ChatRoom

var _ = require("lodash");
var util = require("util");
var ChatRoom = require("./ChatRoom");


function Homeroom(params) {
	ChatRoom.call(this, params);
}

util.inherits(Homeroom, ChatRoom);


// METHODS


Homeroom.prototype.getInfo = function() {
	var info = Homeroom.super_.prototype.getInfo.call(this);
	info.type = "Homeroom";
	return info;
}

// join override:
//   when connection joins homeroom, subscribe to school gameroom updates for them
//	 callback: done(err, info about this room)
Homeroom.prototype.join = function(conn, done) {
	Homeroom.super_.prototype.join.call(this, conn, function(err, roomInfo) {
		if (!err) {
			console.log("gameroom joined by " + conn.user.nickname);
			roomInfo.type = "Homeroom";
			if (done) done(null, roomInfo);
		}
		else {
			console.log(conn.user.nickname + " couldn't join gameroom: ", err);
			if (done) done(err);
		}
	});
}


module.exports = Homeroom;