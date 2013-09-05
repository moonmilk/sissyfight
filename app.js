
/**
 * Module dependencies.
 */

var express = require('express')
  , RedisStore = require('connect-redis')(express)
  , redis = require('redis').createClient()
  , http = require('http')
  , path = require('path')
  , sockjs  = require('sockjs')
;
  
  
  
// database setup  
var db = require('./database');


// ORM setup
var User = require('./models/user');

// let sequelize make tables
db.sequelize.sync().success( function() {

	/* 
	// test!
	User.findOrCreate({nickname: 'cassie'}, {password: 'dent', avatar:{face:3,something:'i like bananas'}})
		.success(function(newuser, created){
			//console.log(newuser.values)
			//console.log(newuser.avatar)
		});
	
	
	User.findOrCreate({nickname: 'dorcas'}, {password: 'bump', avatar:{face:2,hair:5,addons:[102],something:'peaches are yummy'}})
		.success(function(newuser, created){

			console.log("before inc", newuser.points);
			newuser.increment('points', 10).success(function(newuser) {
				console.log("before reload", newuser.points);
				newuser.reload().success(function(newuser) {
					console.log("reloaded", newuser.points);	
				});
			})
		});
	*/
});


// socksjs setup
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};
var sockjs = sockjs.createServer(sockjs_opts);


// app setup
var app = express();

// session store
var sessionStore = new RedisStore({ host: 'localhost', port: 6379, client: redis }); //new express.session.MemoryStore();
app.set('sessionStore', sessionStore);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
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
app.use(express.static(path.join(__dirname, 'public')));


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

