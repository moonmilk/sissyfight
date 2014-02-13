
/**
 * Module dependencies.
 */

var express = require('express')
  , RedisStore = require('connect-redis')(express)
  , redis = require('redis')
  , http = require('http')
  , path = require('path')
  , sockjs  = require('sockjs')
;
  
// i like to use lodash
var _ = require('lodash');

  
// database setup  
var db = require('./database');


// ORM setup
var User = require('./models/user');



// socksjs setup
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};
var sockjs = sockjs.createServer(sockjs_opts);


// app setup
var app = express();


// optional basic authentication for setting up closed testing sessions:
//  set environment variable BASIC_AUTH=username,password[|username,password]
var basic_auth = undefined;
var basic_auth_str = process.env.BASIC_AUTH;
if (basic_auth_str) {
	var basic_auth_users = _.map(basic_auth_str.split('|'), function(userAndPassword) {
		return userAndPassword.split(',');
	});
	console.log(JSON.stringify(basic_auth_users));
	// basic_auth_users now contains [[username, password], [username, password]....]
	
	// now set up the basic auth middleware as in http://stackoverflow.com/a/12148212
	basic_auth = express.basicAuth(function(user, pass) {     
		for (var i=0; i<basic_auth_users.length; i++) {
			if (user==basic_auth_users[i][0] && pass==basic_auth_users[i][1]) return true;
		}
		return false;
	},'SiSSYFiGHT testing');
}


// session store
var redisClient;
var sissyfight_redis_str = process.env.SISSYFIGHT_REDIS;
if (sissyfight_redis_str) {
	var sissyfight_redis = sissyfight_redis_str.split('|'); // redis|host|port|database|auth|
	redisClient = redis.createClient(sissyfight_redis[2], sissyfight_redis[1]); // port, host
	redisClient.auth(sissyfight_redis[4], function (err) {
		if (err) {
			console.log('redis connection trouble');
			throw(err);
		}
		else {
			console.log('remote redis authenticated');
		}
	});
}
else {
	redis.createClient(6379, 'localhost')
	console.log('connected to local redis');
}
//var sessionStore = new RedisStore({ host: 'localhost', port: 6379, client: redis }); //new express.session.MemoryStore();
var sessionStore = new RedisStore({client:redisClient});
app.set('sessionStore', sessionStore);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

// add authentication if set up
if (basic_auth) app.use(basic_auth);

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.set('cookiekey', 'sf2k');
app.use(express.cookieParser());  // vvvv---- move to secret config
app.use(express.session({store: sessionStore // http://stackoverflow.com/questions/14014446/how-to-save-and-retrieve-session-from-redis
						, key: app.get('cookiekey')
						, secret: 'I like bananas'
						, maxAge:12*60*60*1000
						//, expires: new Date(Date.now() + (12*60*1000))
						, cookie:{maxAge:12*60*60*1000}})); // http://www.senchalabs.org/connect/session.html    http://stackoverflow.com/a/11827382
app.use(app.router);



app.locals.pretty = true; // make jade output more readable

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


// set up page controllers
require('./controllers/controllers')(app);


// set up socket controllers
require('./controllers/sockjs')(app, sockjs);


// catchall
app.get('/user/*', function(req, res) {
	res.redirect('/');
});

/*app.post('/user/new', user.createUser);
app.post('/user/login', user.login);
app.post('/user/logout', user.logout);
*/

// supposed to install sockjs handlers last
var server = http.createServer(app);
sockjs.installHandlers(server, {prefix:'/sox'});

// schools
var School = require('./gameObjects/school');
var schools = {'666': new School({id:'666', name:'PS 666'})};
app.set('schools', schools);
app.set('schoolDefault', '666');

/*
// make a lobby room
var ChatRoom = require('./gameObjects/chatroom');
var lobby = new ChatRoom({name:'lobby', id:1});

// make a game room
var GameRoom = require('./gameObjects/gameroom');
var gameroom = new GameRoom({name:'gameroom', id:3, schoolId:666, maxUsers: 6});
app.set('lobby', gameroom);
*/

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
/*server.on("listening", function() {
  console.log("Server fired listening event");  // now it's really started
});
*/
module.exports = server; // export it for test suite

