/* 
	Rankings model
*/
//var db = require('../database');
var User = require('./user');
var _ = require('lodash');

function Rankings() {
	
}

// return this month's top (100) ranked players
Rankings.thisMonth = function(limit, callback) {
	if (!limit) limit=100;
	
	var top = User.findAll({
		attributes: [
			'id', 'nickname', 'avatar', 
			'month_points', 'month_games', 'month_wins', 'month_wins_solo', 
			'alltime_points', 'alltime_games', 'alltime_wins', 'alltime_wins_solo',
			['ROUND(100 * month_wins / month_games)', 'month_win_pct'],
			['ROUND(100 * alltime_wins / alltime_games)', 'alltime_win_pct'],
			['ROUND(100 * alltime_wins_solo / alltime_games)', 'alltime_win_solo_pct'],
			['ROUND(100 * (alltime_wins-alltime_wins_solo) / alltime_games)', 'alltime_win_team_pct'],
		],
		where: {month_games: {gt: 0}},
		order: [['month_points', 'DESC']],
		limit: limit
	}, {raw: true}
	).complete(function(error, results) {
		if (error) callback(error);
		// decode avatar
		_.each(results, function(player) {
			if (player.avatar.length > 0) player.avatar = JSON.parse(player.avatar);
		});
		callback(null, results);
	});
}

module.exports = Rankings;