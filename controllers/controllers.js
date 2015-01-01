/*
	controllers
	
	For now, controllers are simple, so they can all sit in one file
	Split 'em out if they get too big
	
	/u - ajax handlers for user functions (login, new, forgot password)
	/user - non-ajax handlers for user functions (logout)
	
	/main - login page
	/game - game page
	
*/
var User = require('../models/user');
var Rankings = require('../models/rankings');
var qs = require('querystring');
var moment = require('moment');
var whiskers = require('whiskers');
var fs = require('fs');

var Hashids = require("hashids"),
    hashids = new Hashids("tokens");

var text = require('../models/text');

// helper: check that all listed arguments are strings
function checkArgs(body, args) {
	for (var i in args) {
		if (typeof body[args[i]] !== 'string') return false;
	}
	return true;
}



module.exports = function(app) {
	/* GLOBALS --- */
	// load subtemplates for including in pages
	this.includes = {
		mainheader: fs.readFileSync('views/inc_mainheader.html')
	};
	
	
	/* HOMEPAGE --------------------------- */
	app.get('/', function(req, res) {
		res.redirect('/main');
	});


	/* WEB PAGES ----------------------------------------- */

	// 	/main: register - login - recover password form that fits in game window
	app.get('/main', function(req, res) {				
		// for school populations
		var schools = app.get('schools');
		
		var context = {
			includes: this.includes,

			// reminder to change this to less awkward code someday:
			schoolpop1: schools['franklin'].getPopulation(),
			schoolpop2: schools['angel'].getPopulation(),
			schoolpop3: schools['666'].getPopulation(),
			schoolpop4: schools['suzy'].getPopulation()
		};
		
		if (req.session.user) {
			context.loggedIn = 1;
			context.nickname = req.session.user.nickname;
		}
		else {
			context.loggedIn = 0;
			context.nickname = '';
		}
		
		text.retrieve('homepage-news', function(err,texts) {
			if (!err) context.news = texts['homepage-news'];
			
			res.render('main.html', context);
		});
	});
	
	
	// reset password stage 2 page
	app.get('/reset/:code', function(req, res) {
		req.session.destroy();
		var context = {
			includes: this.includes,
			code: req.params.code
		};
		res.render('resetpw.html', context);
	});
	
	// site pages
	app.get('/pages/:page', function(req, res) {
		fs.exists('views/pages/'+req.params.page, function(exists) {
		
			if (exists) {
				var context = {
					includes: this.includes,
					rankings: {}
				};
				
				var userid = undefined;
				
				if (req.session.user) {
					context.loggedIn = 1;
					context.nickname = req.session.user.nickname;
					userid = req.session.user.id;
				}
				else {
					context.loggedIn = 0;
					context.nickname = '';
				}
				
				
				if (req.params.page == 'rankings.html') {
					Rankings.everything(userid, function(error, rankings) {
						
						if (error) {
							context.rankings.failed = true;
							console.log("RANKINGS sql error", error);
						}
						else {
							context.rankings = rankings;
							context.rankings.lastmonth_top = rankings.past_top['2014-12'];
							context.rankings.lastmonth_user = rankings.past_user ? rankings.past_user['2014-12'] : undefined;
							
							context.rankings.previousmonth = moment().subtract(1, "months").format('MMMM YYYY');
						}
						
						context.rankings.currentmonth = moment().format('MMMM YYYY');
						
						var daystogo = 1 + moment().daysInMonth() - moment().date();
						context.rankings.daystogo = daystogo + (" day" + ((daystogo == 1) ? "" : "s"));
						
						res.render('pages/rankings.html', context);
					});
				}
				
				
				else res.render('pages/'+req.params.page, context);
			}
			else res.status(404).send('Not found.');
		});

	});
	
	
	// login problem pages (just doubleconnect for now)
	app.get('/problem/:which', function(req, res) {
		var context = {
			includes: this.includes
		}
		if (req.session.user) {
			context.loggedIn = 1;
			context.nickname = req.session.user.nickname;
		}
		else {
			context.loggedIn = 0;
			context.nickname = '';
		}
		res.render('doubleconnect.html', context);
	});
	
	
	/* --- GAME PAGE ------------------------------------- */

	app.get('/game/:school', function(req, res) {
		if (req.session.user) {
			// send a token to the page that can be used to associate the socket with the user session
			var token = hashids.encrypt(req.session.user.id) + Math.random();
			req.session.token = token;
			// get school id or default
			if (req.params.school && app.get('getSchoolInfo')(req.params.school)) {
				req.session.school = req.params.school;
			}
			else {
				req.session.school = app.get('schoolDefault'); 
			}
			var gameScale = 1, gameWidth=528, gameHeight=276;
			if (req.param('double')) {
				gameScale *= 2;
				gameWidth *= 2;
				gameHeight *= 2;
			}
			var context = {
				loggedIn: 1,
				includes: this.includes,
				nickname:req.session.user.nickname,
				token:req.session.token, session:req.session.id,
				school:req.session.school, 
				gameScale:gameScale, gameWidth:gameWidth, gameHeight:gameHeight,
				singleSize: (gameScale==1),
				doubleSize: (gameScale==2)	
			};
			text.retrieve('homepage-news', function(err,texts) {
				if (!err) context.news = texts['homepage-news'];
				res.render('game.html', context)
			});
		}
		else {
			res.redirect('/main'); 
		}
		
	});	
	
	
	/* AJAX ENDPOINTS ----------------------------------------- */
	
	
	//  /u/login: ajax login endpoint
	app.post('/u/login', function(req, res) {
		if (!checkArgs(req.body, ['nickname', 'password'])) {
			res.json({ok: false});
			return;
		};
		
		User.checkLogin(req.body.nickname.trim(), req.body.password, function(err, user) {
			if (err) {
				res.json({
					ok: false,
					message: "Can't reach the database. Try again later?"
				});
				console.log("/u/login checklogin trouble: " + err);
			}
			else {
				if (user) {
					req.session.user = {nickname:user.nickname, id:user.id, level:user.level};
					res.json({
						ok: true,
						nickname: user.nickname,
						message: ""
					});
				}
				else {
					delete req.session['user'];
					res.json({
						ok: false,
						message: "That username + password didn't work! Try again?"
					});
				}
			}
		});	
	});
	
	
	//	/u/checkNameDOB: see if name is legal and available, and age is 13 years or older
	app.post('/u/checkNameDOB', function(req, res) {
		if (!checkArgs(req.body, ['newname', 'dob_year', 'dob_month', 'dob_day'])) {
			res.json({ok: false});
			return;
		}
		
		// age check
		var birthdate = moment(req.body.dob_year + "-" + req.body.dob_month + "-" + req.body.dob_day, "YYYY-MM-DD");
		if (!birthdate.isValid()) {
			res.json({ok: false, message: "Invalid date"});
			return;
		}
		else {
			var age = moment().diff(birthdate, 'years');
			if (age < 13) {
				res.json({ok: false, underage: true, message: "Sorry, you have to be 13 or older to play."});
				res.cookie('sfunderage', '1', { maxAge: 24*60*60*1000});
				return;
			}
		}
		
		
		// nick check
		var nick = req.body.newname.trim();
		
		User.checkNicknameAndEmail(nick, null, function(err, result) {
			if (err) {
				res.json({
					ok: false,
					message: "Can't reach the database. Try again later?"
				});
				console.log("/u/checkName trouble: " + err);
			}
			else {
				if (result) {
					res.json({
						ok: false,
						error: result.error,
						message: result.msg
					});					
				}
				else {
					res.json({
						ok: true,
						message: ""
					})
				}
			}
		});
	});
	
	
	//	/u/new: create new account
	//		args: newname, password, email, year, month, day (date of birth)
	app.post('/u/new', function(req, res) {
		if (!checkArgs(req.body, ['newname', 'password', 'email', 'dob_year', 'dob_month', 'dob_day'])) { 
			res.json({ok: false});
			return;
		}
		
		// age check
		var birthdate = moment(req.body.dob_year + "-" + req.body.dob_month + "-" + req.body.dob_day, "YYYY-MM-DD");
		if (!birthdate.isValid()) {
			res.json({ok: false, message: "Invalid date"});
			return;
		}
		else {
			var age = moment().diff(birthdate, 'years');
			if (age < 13) {
				res.json({ok: false, message: "Sorry, you have to be 13 or older to play."});
				res.cookie('sfunderage', '1');
				return;
			}
		}
		
		
		var nick = req.body.newname.trim();
		
		User.checkNicknameAndEmail(nick, req.body.email, function(err, result) {
			if (err) {
				delete req.session['user'];
				res.json({
					ok: false,
					message: "Can't reach the database. Try again later?"
				});
				console.log("/u/checkName trouble: " + err);
			}
			else {
				if (result) {
					delete req.session['user'];
					res.json({
						ok: false,
						error: result.error,
						message: result.msg
					});					
				}
				else {		
					User.createUser({nickname:nick, password:req.body.password, email:req.body.email}, function(err, user) {
						if (err) {
							delete req.session['user'];
							console.log('/u/new: createUser error: ' + qs.stringify(err));
							res.json({
								ok: false,
								message: err.toString()
							});					
						}
						else {
							req.session.user = user; 
							res.json({
								ok: true,
								nickname: user.nickname
							});
						}
		})
				}
			}
		});

	});
	
	
	// reset password request
	//	args: email, nickname
	app.post('/u/requestReset', function(req, res) {
		if (!checkArgs(req.body, ['resetnickname', 'resetemail'])) { 
			res.json({ok: false});
			return;
		}
		User.requestPasswordResetEmail(req.body.resetnickname.trim(), req.body.resetemail.trim(), function(err) {
			if (err) {
				res.json({
					ok: false,
					message: err.toString()
				});
			}
			else {
				res.json({
					ok: true
				})
			}
		});
	});
	
	// reset password stage 3
	app.post('/u/resetPassword', function(req, res) {
		if (!checkArgs(req.body, ['email', 'password', 'code'])) {
			res.json({ok: false});
			return;
		}
		User.resetPassword(req.body.email.trim(), req.body.code, req.body.password, function(err, result) {
			if (err) {
				res.json({
					ok: false,
					message: err
				})
			}
			else {
				res.json({
					ok: true,
					nickname: result
				})
			}
		});
	})
	

	
	app.get('/user/logout', function(req, res) {
		req.session.destroy();
		res.redirect('/main');// + qs.stringify(req.query));
	});
	app.post('/user/logout', function(req, res) {
		req.session.destroy();
		res.redirect('/main'); //' + qs.stringify(req.query));
	});
	

}