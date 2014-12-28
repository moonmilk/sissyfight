/* 
	Rankings model
*/
var db = require('../database');
var User = require('./user');
var _ = require('lodash');

function Rankings() {
	
}

// return this month's top (100) ranked players, plus data for user if given
Rankings.thisMonth = function(limit, userid, callback) {
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
		if (userid) Rankings.thisMonthUserInfo(results, userid, callback);
		else callback(null, {top:results, user:null});
	});
}

Rankings.thisMonthUserInfo = function(topresults, userid, callback) {
	var query = "SELECT a1.id, a1.nickname, a1.avatar, "
				+ "a1.month_points, a1.month_games, a1.month_wins, a1.month_wins_solo, "
				+ "a1.alltime_points, a1.alltime_games, a1.alltime_wins, a1.alltime_wins_solo, "
				+ "ROUND(100 * a1.month_wins / a1.month_games) AS month_win_pct, "
				+ "ROUND(100 * a1.alltime_wins / a1.alltime_games) AS alltime_win_pct, "
				+ "ROUND(100 * a1.alltime_wins_solo / a1.alltime_games) AS alltime_win_solo_pct, "
				+ "ROUND(100 * (a1.alltime_wins-a1.alltime_wins_solo) / a1.alltime_games) AS alltime_win_team_pct, "
				+ "COUNT(a2.nickname) points_rank " 
				+ "FROM Users a1, Users a2 "
				+ "WHERE a1.id=:id AND (a1.month_points < a2.month_points OR (a1.month_points=a2.month_points AND a1.id = a2.id) ) "
				+ "GROUP BY a1.month_points ";
	
	db.sequelize.query(query, null, {raw:true}, {id: userid}).complete(function(error, userresults) {
		if (error) callback(error);	
		else {
			if (userresults.length==0) userresults = null;
			else userresults = userresults[0];
			
			// decode avatar
			if (userresults.avatar.length > 0) userresults.avatar = JSON.parse(userresults.avatar);
			
			// if no games this month, no rank
			if (userresults.month_games == 0) userresults.points_rank = undefined;
			
			callback(null, {top:topresults, user:userresults});
		}
	});
}

/*
	Saving rankings to history table at end of month (example for December rankings, to be computed at 4am Jan 1)
	INSERT INTO MonthlyScores (id, record_month, month_points, month_games, month_wins, month_wins_solo, month_points_rank, month_win_pct)
	SELECT a1.id, "2014-12-01", a1.month_points, a1.month_games, a1.month_wins, a1.month_wins_solo, count(a2.month_points) month_points_rank, (a1.month_wins / a1.month_games)
		FROM Users a1, Users a2
		WHERE a1.month_games > 0 AND a2.month_games > 0 AND (a1.month_points < a2.month_points OR (a1.month_points=a2.month_points AND a1.id = a2.id))
		GROUP BY a1.id, a1.month_points
	ON DUPLICATE KEY UPDATE record_month = record_month	
*/

module.exports = Rankings;