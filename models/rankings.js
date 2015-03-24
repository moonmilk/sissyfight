/* 
	Rankings model
*/
var db = require('../database');
var User = require('./user');
var _ = require('lodash');
var async = require('async');
var moment = require('moment');

function Rankings() {
	
}

Rankings.MONTH_TABLE = "MonthlyScores";

// everything! current high scores, all past months, current user, top from hall of fame
Rankings.everything = function(userid, callback) {
	var tasks = {};
	tasks.current_top = function(cb) {
		Rankings.thisMonth(100, cb);
	};
	tasks.past_top = function(cb) {
		Rankings.pastMonth(null, null, cb);
	}
	tasks.hall_of_fame = function(cb) {
		Rankings.hallOfFame(100, cb);
	}

	if (userid) {
		tasks.current_user = function(cb) {
			Rankings.thisMonthUserInfo(userid, cb);
		};
		tasks.past_user = function(cb) {
			Rankings.pastMonth(null, userid, cb);
		};
	}
	async.parallel(tasks, callback);
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

Rankings.thisMonthUserInfo = function(userid, callback) {
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
			
			callback(null, userresults);
		}
	});
}


// players of the month 
//		for given past month (in format "2014-12"), or all months if month is null
//		and for given userid, or all *ranked* users if userid is null
// returns records grouped by month: {"2014-12":[records], "2014-11":[records], ...} or {"2014-12":{single user record}, ...}
Rankings.pastMonth = function(month, userid, callback) {
	var whereTerms = [], queryArgs = {};
	if (month) {
		whereTerms.push("month=:month ");
		queryArgs.month = month;
	}
	if (userid) {
		whereTerms.push("Users.id=:userid ");
		queryArgs.userid = userid;
	}
	else {
		// if single user not specified, only retrieve ranked users
		whereTerms.push(Rankings.MONTH_TABLE + ".month_win_pct_rank > 0 ");
	}

	var query = "SELECT " + Rankings.MONTH_TABLE + ".record_month, "
				+	"Users.id, Users.nickname, Users.avatar, "
				+ 	Rankings.MONTH_TABLE + ".month_points, " + Rankings.MONTH_TABLE + ".month_games, " + Rankings.MONTH_TABLE + ".month_wins, " + Rankings.MONTH_TABLE + ".month_wins_solo, "	
				+ 	"ROUND(100*" + Rankings.MONTH_TABLE + ".month_win_pct) as month_win_pct, "
				+ 	"ROUND(100 * Users.alltime_wins / Users.alltime_games) as alltime_win_pct, "
				+ 	"ROUND(100 * Users.alltime_wins_solo / Users.alltime_games) as alltime_win_solo_pct, "
				+ 	"ROUND(100 * (Users.alltime_wins-Users.alltime_wins_solo) / Users.alltime_games) as alltime_win_team_pct, "
				+ 	Rankings.MONTH_TABLE + ".month_win_pct_rank "
				+ "FROM " + Rankings.MONTH_TABLE + " INNER JOIN Users USING (id) "
				+ 	"WHERE " + whereTerms.join(" AND ")
				+ "ORDER BY record_month DESC, month_win_pct_rank ASC";
				
	db.sequelize.query(query, null, {raw:true}, queryArgs).complete(function(error, results) {
		if (error) callback(error);
		
		else {
			// organize records by month and decode avatar json
			var monthlyResults = {};
			_.each(results, function(record) {
				if (userid) monthlyResults[record.record_month] = record; // don't package single user results in array
				else {
					if (!monthlyResults[record.record_month]) monthlyResults[record.record_month] = [];
					monthlyResults[record.record_month].push(record);
				}
				// decode avatar
				if (record.avatar.length > 0) record.avatar = JSON.parse(record.avatar);
			});
			callback(null, monthlyResults);
		}
	});
}



// get months for which historic score data is available
Rankings.getMonths = function(callback) {
	db.sequelize.query("SELECT DISTINCT record_month FROM " + Rankings.MONTH_TABLE + " ORDER BY record_month DESC").complete(callback);
}


// Hall of Fame: top (100) users with the most fame points
Rankings.hallOfFame = function(limit, callback) {
	if (!limit) limit = 100;

	var query = "SELECT SUM(" + Rankings.MONTH_TABLE + ".month_fame_points) as total_fame, "
				+	"Users.id, Users.nickname, Users.avatar, "
				+ 	"ROUND(100 * Users.alltime_wins / Users.alltime_games) as alltime_win_pct, "
				+ 	"ROUND(100 * Users.alltime_wins_solo / Users.alltime_games) as alltime_win_solo_pct, "
				+ 	"ROUND(100 * (Users.alltime_wins-Users.alltime_wins_solo) / Users.alltime_games) as alltime_win_team_pct "
				+ "FROM Users INNER JOIN " + Rankings.MONTH_TABLE + " USING(id) "
				+ "GROUP BY id "
				+ "HAVING total_fame > 0 "
				+ "ORDER BY total_fame DESC "
				+ "LIMIT :limit ";
	
	db.sequelize.query(query, null, {raw:true}, {limit: limit}).complete(function(error, results) {
		if (error) callback(error);
		else {
			var rank = 1;
			_.each(results, function(record) {
				// decode avatar
				if (record.avatar.length > 0) record.avatar = JSON.parse(record.avatar);
				record.rank = rank++;
			});		
			callback(null, results);
		}
	});
	
}


// Rollover: update rankings at the first of each month
Rankings.rollover = function(callback) {
	var queries = [];
	var lastMonth = moment().subtract(1, "months").format('YYYY-MM');

	// Copy players' monthly scores to MonthlyScores table and compute ranking by points 	
	queries.push(
		"INSERT INTO MonthlyScores (id, record_month, month_points, month_games, month_wins, month_wins_solo, month_points_rank, month_win_pct) "
		+ "SELECT a1.id, :LAST_MONTH, a1.month_points, a1.month_games, a1.month_wins, a1.month_wins_solo, count(a2.month_points) month_points_rank, (a1.month_wins / a1.month_games) "
		+ "FROM Users a1, Users a2 "
		+ "WHERE a1.month_games > 0 AND a2.month_games > 0 AND (a1.month_points < a2.month_points OR (a1.month_points=a2.month_points AND a1.id = a2.id)) "
		+ "GROUP BY a1.id, a1.month_points "
		+ "ON DUPLICATE KEY UPDATE record_month = record_month ";
	);
	
	// Then reset players' monthly scores to 0 for next month
	queries.push(
		"UPDATE Users SET month_points=0, month_games=0, month_wins=0, month_wins_solo=0";
	);
	
	// Finally update the records with rank-by-win-percent for those whose rank-by-points is up to 25:
	queries.push(
		"UPDATE MonthlyScores, "
		+ "( " 
		+ "		SELECT a1.id as rank_id, count(a2.month_win_pct) as computed_rank "
		+ "		FROM "
		+ "			(SELECT id, month_win_pct from MonthlyScores "
		+ "				WHERE month_points_rank > 0 AND month_points_rank <= 25 "
		+ "				AND record_month = :LAST_MONTH "
		+ "			) a1, "
		+ "			(SELECT id, month_win_pct from MonthlyScores "
		+ "				WHERE month_points_rank > 0 AND month_points_rank <= 25 "
		+ " 			AND record_month = :LAST_MONTH "
		+ "			) a2 "
		+ "		WHERE a1.month_win_pct <= a2.month_win_pct OR (a1.month_win_pct = a2.month_win_pct AND a1.id = a2.id) "
		+ "		GROUP BY a1.id, a1.month_win_pct "
		+ "		ORDER BY a1.month_win_pct DESC, a1.id DESC "
		+ ") rankedTable "
		+ "SET month_win_pct_rank = computed_rank, month_fame_points = 26 - computed_rank "
		+ "WHERE id = rank_id "
		+ "AND record_month = :LAST_MONTH ";	
	);
	
	// make it happen!
	async.eachSeries(queries, function(query, cb) {
		db.sequelize.query(query, null, {raw:true}, {LAST_MONTH: lastMonth}).complete(cb);
	}, callback);
}


module.exports = Rankings;