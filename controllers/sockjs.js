/*
	sockjs controllers
	
	For now, controllers are simple, so they can all sit in one file
	Split 'em out if they get too big
*/

var User = require("../models/user");



module.exports = function(app, sockjs) {
	// since i'm merging socket native events with chat events, don't accept any chat events with names that match the native ones
	var EVENT_BLACKLIST = ['data', 'close']; 
	var userConnections = {}; // map users to connections ####todo: make sure there's no way for a dropped connection to lead to a user staying in this list and not being able to reconnect
	
	// new socket connection!
	sockjs.on("connection", function(conn) {
		/* NATIVE SOCKET EVENTS */
	
		// add json writer with event name (string) and data payload (json)
		conn.writeEvent = function(type, data) {
			if (conn.writable) conn.write(JSON.stringify({type: type, data: data}));
		}
		
		// Decode incoming messages of form {type:'event name', data: {event data or null}} and ignore others.
		// Dispatch good messages as events, except ones that could be confused with sockjs events.
		conn.on("data", function(data) {
			//socketListener(conn, message);
			var message;
			
			try { 
				//console.log("incoming: ", data);
				message = JSON.parse(data); 
				//console.log("decoded: ", message);
			}
			catch (err) {
				return;
			};
			if ((typeof message)==='object' && (typeof message.type)==='string' && (message.data===undefined || typeof message.data==='object')) {
				if (EVENT_BLACKLIST.indexOf(message.type)==-1) {
					conn.emit(message.type, message.data);
				}
			}
		});
		
		conn.on("close", closeListener);
		
		/* SISSYFIGHT EVENTS */
		
		conn.on("login", loginListener);
		

	});
	
	
	function closeListener(data) {
		conn = this;
		if (conn.room) conn.room.leave(conn);
		if (conn.user) delete userConnections[conn.user.id];
		if (conn.user) console.log("Socket: user " + conn.user.nickname + " disconnected.");
	}
	

	
	function loginListener(data) {
		conn = this; 
		
		// try to connect with the session
		if (data.session && data.token) {
			app.get('sessionStore').get(data.session, function(err, session) {
				if (err) {
					console.log("Socket login: couldn't access session store for session id " + data.session + ": " + err);
					conn.writeEvent("login", {error:"nostore", message: "Couldn't access session store: " + err.toString()});
				}
				else if (!session) {
					console.log("Socket login: no such session " + data.session);
					conn.writeEvent("login", {error:"nosession", message: "No such session"});
				}
				else if (!session.user) {
					console.log("Socket login: session's not logged in " + data.session);	
					conn.writeEvent("login", {error:"notlogged", message: "Session's not logged in"});
				}
				else if (session.token !== data.token) {
					console.log("Socket login: bad token " + data.token + " for session " + data.session);
					conn.writeEvent("login", {error:"token", message: "Bad token"});
				}
				else if (userConnections[session.user.id]) {
					console.log("Socket login: user "+session.user.nickname+" already has a connected socket");
					conn.writeEvent("login", {error:"multi", message: "Already connected"});
				}
				else if (!session.school || !app.get('schools')[session.school]) {
					console.log("Socket login: user "+session.user.nickname+" has unknown school " + session.school);
					conn.writeEvent("login", {error:"noschool", message: "Unknown school"});
				}
				else {
					// everything is good: socket corresponds to a logged-in session - connect the user
					conn.removeListener("login", loginListener);
					
					// grab fresh user object (deserialized user from session may be out of date, and it doesn't have ORM methods)
					User.find(session.user.id).complete( function(err, user) {
						if (err) {
							console.log("Socket login: couldn't find user object due to database problem: " + err);
							conn.writeEvent("login", {error:"dbusererr", message: "Database trouble"});
						}
						else if (!user) {
							console.log("Socket login: couldn't find user for id "+session.user.id+" in database")
							conn.writeEvent("login", {error:"dbnouser", message: "Couldn't find user in db"});
						}
						else {
							console.log("Socket login: retrieved db record for user  " + user.nickname);
						
							conn.user = user;
							conn.school = app.get('schools')[session.school];
							
							userConnections[conn.user.id] = {conn:conn};
							
							console.log("Socket login: found session for socket, user " + session.user.nickname);
							
							if (!conn.user.avatar) conn.user.avatar={};
							
							conn.writeEvent("login", {error:false, nickname:conn.user.nickname, avatar:conn.user.avatar});
							
							/* SISSYFIGHT EVENTS */
												
							conn.on("say", sendChatListener);
							conn.on("homeroom", joinHomeroomListener);
							
							conn.on("getAvatar", getAvatarListener);
							conn.on("setAvatar", setAvatarListener);
						}
					});
				}

			});
		}
		else {
			console.log("Socket login: event missing session or token");
			conn.writeEvent("login", {error:"tsnotsupp", message:"Missing session or token"});
		}
	}
	
	
	
	function sendChatListener(data) {
		conn = this;
		
		if (this.room && (typeof data.text)==="string") this.room.say(conn, data.text);
	}	
	
	
	
	function getAvatarListener(data){
		conn = this;
		sendAvatar(conn);
	}
	
	function sendAvatar(conn) {
		if (!conn.user) {
			conn.writeEvent("avatar", {error:"notlogged", message:"Socket's not logged in"});
			console.log("sendAvatar: socket not logged in");
			return;
		}
		else if (!conn.user.avatar) {
			conn.user.avatar = {};
		}
		conn.writeEvent("avatar", {error:false, avatar:conn.user.avatar});
		console.log("sendAvatar: user " + conn.user.nickname + " retrieved avatar " + JSON.stringify(conn.user.avatar));
	}
	
	function setAvatarListener(data) {
		conn = this;
		if (false) {
			// TODO: should do sanity testing on avatar here or in model ####
			conn.writeEvent("avatar", {error:'badavatar', message:"Badly formatted avatar object or item out of range"});
			console.log("setAvatar: Badly formatted avatar object or item out of range");
			return;
		}
		if (!conn.user) {
			conn.writeEvent("avatar", {error:"notlogged", message:"Socket's not logged in"});
			console.log("setAvatar:: socket not logged in");
			return;
		}
		conn.user.avatar = data.avatar;
		conn.user.save().complete(function(err){
			if (err) {
				console.log("setAvatarListener: trouble saving user " + conn.user.nickname + ": " + error);
				conn.writeEvent("avatar", {error:"dbaverr", message:"Trouble saving the avatar"});
			}
			else {
				console.log("setAvatar: avatar set...");
				sendAvatar(conn);
			}
		});
	}
	
	
	function joinHomeroomListener(data) {
		conn = this;
		if (!conn.user) {
			conn.writeEvent("homeroom", {error:"notlogged", message:"Socket's not logged in"});
			console.log("joinHomeroomListener: socket not logged in");
			return;
		}
		if (!conn.school) {
			console.log("joinHomeroomListener: user "+conn.user.nickname+" has unknown school");
			conn.writeEvent("homeroom", {error:"noschool", message: "Unknown school"});
		}
		if (conn.room) {
			console.log("joinHomeroomListener: user "+conn.user.nickname+" is already in school " + conn.school.id + " room " + conn.room.id);
			conn.writeEvent("homeroom", {error:"inaroom", message: "Already in a room"});
		}
		
		conn.school.getHomeroom(function(err, homeroom) {
			if (err) {
				console.log("joinHomeroomListener: user "+conn.user.nickname+" couldn't get school " + conn.school.id + " homeroom: " + err);
				conn.writeEvent("homeroom", {error:"nohomeroom", message: err.message});
			}
			else {
				homeroom.join(conn, function(err) {
					if (err) {
						console.log("joinHomeroomListener: user "+conn.user.nickname+" couldn't join school " + conn.school.id + "homeroom " + err);
						conn.writeEvent("homeroom", {error:"joinhomeroom", message: err.message});
					}
					else {
						console.log("joinHomeroomListener: user "+conn.user.nickname+" joined school " + conn.school.id + " homeroom.");
						conn.writeEvent("homeroom", {error:null});
					}
				});
			}
		});
		
	}
	

}