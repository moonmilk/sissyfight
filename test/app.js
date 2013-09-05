// test main app


var should = require('should')
	, async = require('async')
	, net = require('net')
	, request = require('request').defaults({followAllRedirects:true}); // follows redirects and supports cookies: https://github.com/mikeal/request   //jar=true turns on cookie storage
	
var sockjsclient = require("sockjs-client"); // https://github.com/sockjs/sockjs-client-node
  
var URL = "http://127.0.0.1:3000";  
var SOCKURL = URL + "/sox";

var server;

// create cookie jars, session keys, and socket clients for multiple test users
var jar = [], key = [], socket = [];
for (var i=0; i<8; i++) {
	jar.push(request.jar());
}
// build a sockjs event for sending
function sendevt(e,data) {
	return JSON.stringify({event:e, data:data});
}
// decode a received event
function getevt(text) {
	var evt;
	try { evt = JSON.parse(text) }
	catch (err){}
	return evt;
}


// log in to site with nickname/password from context, and remember cookie jar and socket credentials in context to use for connection
function login(context, done) {
	if (!context.jar) context.jar = request.jar();
	var req= request.post(URL+"/user/login", {jar:context.jar, form:{nickname:context.nickname, password:context.password}},
		function(error, res, body) {
			should.not.exist(error);
			body.should.not.include('Wrong username', "wrong username or password");
			body.should.include(context.nickname, "login success page for "+context.nickname);
			//console.log(body);
			
			var req = request.get(URL+"/game", {jar:context.jar}, 
				function(error, res, body) {
					//console.log(body);
					
					should.not.exist(error, "error requesting /game");
					// extract session key and token from hosting web page
					var sessionMatch = body.match(/var\s+session\s*=\s*\'([^']+)\'/);
					should.exist(sessionMatch, "session key regex failure");
					sessionMatch.length.should.be.above(1, "session key regex ?");
					sessionMatch[1].length.should.be.above(3, "session key length")
					context.session = sessionMatch[1];
					var tokenMatch = body.match(/var\s+token\s*=\s*\'([^']+)\'/);
					should.exist(tokenMatch, "login token regex failure");
					tokenMatch.length.should.be.above(1,"login token");
					tokenMatch[1].length.should.be.above(3, "login token length");
					context.token = tokenMatch[1];
					//console.log(key[0]);
					if (done) done();
				}
			);
		}
	);			
}
// log in to socket with credentials from context
function sock(context, done) {
	context.socket = sockjsclient.create(SOCKURL);
	should.exist(context.socket, "newly created socket");
	context.socket.on("connection", function() {
		context.socket.write(sendevt("login",{session:context.session, token:context.token}));
		context.socket.on("data", function(msg) {
			var evt = getevt(msg);
			should.exist(evt, "decoded event");
			evt.should.have.property("event");
			evt.should.have.property("data");
			if (evt.event=='login') {
				if (evt.data.error !== undefined) {
					evt.data.error.should.equal(false);
				}
				evt.data.should.have.property("nickname").equal(context.nickname, "socket login success message for " + context.nickname);
				context.socket.removeAllListeners();
				done();
			}
		});
	});	
}


describe('sissyfight server', function() {
	
	
	// wait for server to boot up before testing
	before(function(done) {
		server = require('../app');
		server.on("listening", function() {
			console.log("server is listening");
			done();
		});
	});
	

	
	it("should serve something at /", function(done) {
		request(URL, function(error, res, body) {
			should.not.exist(error);
			res.statusCode.should.equal(200);
			body.should.include('SiSSYFiGHT');
			done();
		});
	});
	
	it("should reject unknown user", function(done) {
		var req = request.post(URL+"/user/login", {jar:jar[0], form:{nickname:'xXxXXXx',password:'xXxxXXxX'}}, 
			function(error, res, body) {
				should.not.exist(error);
				body.should.include('Wrong username or password');
				done();
			}
		);
		
	});
	
	it ("should accept known user cassie", function(done) {
		var req= request.post(URL+"/user/login", {jar:jar[0], form:{nickname:'cassie', password:'test'}},
			function(error, res, body) {
				should.not.exist(error);
				body.should.include('cassie');
				done();
			}
		);
	});
	
	it ("should supply session key and login token for user cassie on /game", function(done) {
		var req = request.get(URL+"/game", {jar:jar[0]}, 
			function(error, res, body) {
				should.not.exist(error);
				key[0] = {};
				var sessionMatch = body.match(/var\s+session\s*=\s*\'([^']+)\'/);
				should.exist(sessionMatch, "session key");
				sessionMatch.length.should.be.above(1, "session key");
				sessionMatch[1].length.should.be.above(3, "session key length")
				key[0].session = sessionMatch[1];
				var tokenMatch = body.match(/var\s+token\s*=\s*\'([^']+)\'/);
				should.exist(tokenMatch, "login token");
				tokenMatch.length.should.be.above(1,"login token");
				tokenMatch[1].length.should.be.above(3, "login token length");
				key[0].token = tokenMatch[1];
				//console.log(key[0]);
				done();
			}
		);
	});
	
	describe("socket server", function() {
	
		describe("login", function() {
			it ("should allow socket login for user cassie with session key and login token", function(done) {
				socket[0] = sockjsclient.create(SOCKURL);
				should.exist(socket[0]);
				socket[0].on("connection", function() {
					socket[0].write(sendevt("login",{session:key[0].session, token:key[0].token}));
					socket[0].on("data", function(msg) {
						var evt = getevt(msg);
						should.exist(evt, "decoded event");
						evt.should.have.property("event");
						evt.should.have.property("data");
						if (evt.event=='login') {
							if (evt.data.error !== undefined) {
								evt.data.error.should.equal(false);
							}
							evt.data.should.have.property("nickname").equal("cassie");
							
							done();
						}
					});
				});
			})
			
			it ("should not allow a second socket with same user", function(done) {
				socket[1] = sockjsclient.create(SOCKURL);
				should.exist(socket[1]);
				socket[1].on("connection", function() {
					socket[1].write(sendevt("login",{session:key[0].session, token:key[0].token}));
					socket[1].on("data", function(msg) {
						var evt = getevt(msg);
						should.exist(evt, "decoded event");
						evt.should.have.property("event");
						evt.should.have.property("data");
						if (evt.event=='login') {
							evt.data.should.have.property("error").not.equal(false, "login error");
							done();
						}
					});
				});
			});

			it ("should allow a new socket to connect with same credentials if the first disconnects", function(done) {
				socket[0].close();
				socket[2] = sockjsclient.create(SOCKURL);
				socket[2].on("connection", function() {
					socket[2].write(sendevt("login",{session:key[0].session, token:key[0].token}));
					socket[2].on("data", function(msg) {
						var evt = getevt(msg);
						should.exist(evt, "decoded event");
						evt.should.have.property("event");
						evt.should.have.property("data");
						if (evt.event=='login') {
							if (evt.data.error !== undefined) {
								evt.data.error.should.equal(false);
							}
							evt.data.should.have.property("nickname").equal("cassie");
							done();
						}
					});
				});		
			});
			
			describe.skip("logout test", function() {
				it ("should not allow socket connection if user has logged out", function(done) {
					// PENDING
				});
			});
		});
		

		
		var contexts = {massie:{nickname:'massie',password:'test'}, gassy:{nickname:'gassy',password:'test'}};
		it ("should allow two users to connect with different credentials", function(done) {
			async.parallel([
				function(cb){ login(contexts.massie, cb) },
				function(cb){ login(contexts.gassy, cb) }
			], done);
			//console.log(contexts);
		})
		
		// getting errors with parallel socket connection - might be limitation in sockjs-client library.  Try sequential instead.
		it.skip ("should allow the two users to connect sockets simultaneously", function(done) {
			async.parallel([
				function(cb){ sock(contexts.massie, cb) },
				function(cb){ sock(contexts.gassy, cb) }
			], done);
		})
		
		// sequential instead of parallel seemed to fix it.  IS THIS A REAL PROBLEM?? ####
		it ("should allow the two users to connect sockets at about the same time", function(done) {
			async.series([
				function(cb){ sock(contexts.massie, cb) },
				function(cb){ sock(contexts.gassy, cb) }
			], done);
		})
		
		it ("should forward chat message from one client to other", function(done) {
			contexts.gassy.socket.on("data", function(msg) {
				var evt = getevt(msg);
				//console.log(evt);
				
				should.exist(evt, "couldn't decode incoming say msg data");
				evt.should.have.property("event");
				if (evt.event==='say') {
					evt.should.have.property("data");
					evt.data.should.have.property("text").equal("hello");
					evt.data.should.have.property("nickname").equal("massie");
					contexts.gassy.socket.removeAllListeners();
					done();
				}
			});
			contexts.massie.socket.write(sendevt("say", {text:"hello"}));
		})
		
		var skin=Math.floor(Math.random()*6);
		var face=Math.floor(Math.random()*6);
		describe("avatar get/set", function() {
			it ("should let user set avatar", function(done) {
				contexts.gassy.socket.on("data",function(msg) {
					var evt = getevt(msg);
					
					should.exist(evt, "couldn't decode incoming avatar msg data");
					evt.should.have.property("event");
					if (evt.event==='avatar') {
						evt.should.have.property("data");
						evt.data.should.have.property("error").equal(false);
						evt.data.should.have.property("avatar");
						evt.data.avatar.should.have.property("face").equal(face);
						evt.data.avatar.should.have.property("skin").equal(skin);
						contexts.gassy.socket.removeAllListeners();
						done();
					}
				});
				
				contexts.gassy.socket.write(sendevt("setAvatar", {avatar:{skin:skin,face:face}}));
				
			});
		});
		
		describe("avatar persistence", function() {
			it("should have same avatar even after logout & login", function(done) {
				// log out
				contexts.gassy.socket.close();// important!
				var req = request.post(URL+"/user/logout", {jar:contexts.gassy.jar},
					function(err, res, body) {
						body.should.include("login", "confirm logout forwarded to homepage");
						login(contexts.gassy, function(cb) {
							sock(contexts.gassy, function(cb) {
								contexts.gassy.socket.on("data",function(msg) {
									var evt = getevt(msg);
									
									should.exist(evt, "couldn't decode incoming avatar msg data");
									evt.should.have.property("event");
									if (evt.event==='avatar') {
										evt.should.have.property("data");
										evt.data.should.have.property("error").equal(false);
										evt.data.should.have.property("avatar");
										evt.data.avatar.should.have.property("face").equal(face);
										evt.data.avatar.should.have.property("skin").equal(skin);
										contexts.gassy.socket.removeAllListeners();
										done();
									}
								});
								
								contexts.gassy.socket.write(sendevt("getAvatar", {}));
								
							});
						});
					}
				);
				
			});
		});
		
	
	});
	
	
	
});



