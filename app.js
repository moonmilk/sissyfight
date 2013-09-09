
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
  
  
  
// database setup  
var db = require('./database');


// ORM setup
var User = require('./models/user');



// socksjs setup
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};
var sockjs = sockjs.createServer(sockjs_opts);


// app setup
var app = express();


// session store
var redisClient;
var sissyfight_redis_str = process.env.SISSYFIGHT_REDIS;
if (sissyfight_redis_str) {
	var sissyfight_redis = sissyfight_redis_str.split('|'); // redis|host|database|auth
	redisClient = redis.createClient(6379, sissyfight_redis[1]);
	redisClient.auth(sissyfight_redis[3], function (err) {
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

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.set('cookiekey', 'sf2k');
app.use(express.cookieParser());  // vvvv---- move to secret config
app.use(express.session({store: sessionStore // http://stackoverflow.com/questions/14014446/how-to-save-and-retrieve-session-from-redis
						, key: app.get('cookiekey')
						, secret: 'I like bananas'
						, expires: new Date(Date.now() + (12*60*1000))
						, cookie:{maxAge:12*60*1000}})); // http://www.senchalabs.org/connect/session.html    http://stackoverflow.com/a/11827382
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

// make a lobby room
var ChatRoom = require('./gameObjects/chatroom');
var lobby = new ChatRoom({name:'lobby', id:1});

// make a game room
var GameRoom = require('./gameObjects/gameroom');
var gameroom = new GameRoom({name:'gameroom', id:3, schoolId:666, maxUsers: 6});
app.set('lobby', gameroom);
/*
var Room = require('./models/room');
Room.findOrCreate({name:'lobby'}, {name:'lobby'}, function(err, lobby){
	if (err) console.log("Problem creating lobby room: " + err);
	else console.log("Created lobby room " + lobby.name + ": "+ JSON.stringify(lobby));
	app.set('lobby', lobby);
});
*/

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
/*server.on("listening", function() {
  console.log("Server fired listening event");  // now it's really started
});
*/
module.exports = server; // export it for test suite

