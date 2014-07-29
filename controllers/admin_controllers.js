/*
	admin controllers
	
	only user level 999 can access!
*/

var config = require('../config');


function auth(req, res, next) {
	console.log('admin connect attempt', req.session.user ? (req.session.user.nickname + " with level " + req.session.user.level) : 'not logged in');
	if (req.session.user && req.session.user.level >= 999) {
		return next();
	}
	else {
		res.send(404, "Not found.");
	}
}

module.exports = function(app) {


	app.get('/admin/announce', auth, function(req, res) {
		res.render('admin/announce.html');
	});
	
	app.post('/admin/announce', auth, function(req, res) {
		if (typeof req.body.announcement === 'string') {
			app.get('announceToAll')(req.session.user, req.body.announcement);
			console.log('SERVER ANNOUNCEMENT', req.body.announcement);
		}
		res.redirect('/admin/announce');
	});
	
}