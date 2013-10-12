// SFGame - the actual game logic

var _ = require("lodash");
var util = require("util");




function SFGame(gameroom) {
	this.gameroom = gameroom;
	
	this.players = {};	// map from player user ids to game status info
	this.zombies = [];	// players that leave before end of game get moved to this list on the next turn
	
	this.state = "await actions";	// possible states: await actions, await eot, end of game
	
	this.overrideTimer = undefined; // id of setTimeout timer that forces turn to end even if not all clients check in
	
	this.prepareGame();
	this.startGame();
	this.broadcastStatus();
	this.startTurn();
}


// each user starts out with ...
SFGame.INITIAL_STATUS = {
	id:			undefined,	// user id
	nickname:	undefined,	// username for narration
	
	action: 	false,	// when player chooses an action, set this to e.g. 'grab'
	target:		undefined, // if action has a target, set this to target user id
	
	timeout:	false,	// set to true when player's timer has reached 0 (received timeout action)
	zombie:		false,	// set to true if player leaves before end of game
	
	health:		10,
	
	lollies:	3,
	tattles:	2,
	cowardice:	0	// number of times cowered without being attacked
}

SFGame.TURN_TIME = 90;		// max time per turn, in seconds
SFGame.COUNTDOWN_TIME = 10;	// when all players have chosen an action, timer jumps to final countdown
SFGame.OVERRIDE_TIME = 100;	// end turn even if not all clients have checked in (may be hung or hacked client)

// sort order for resolving actions - lower numbers first
SFGame.ACTION_ORDER = {
	"cower": 	1,
	"grab":		2,
	"lick":		3,
	"scratch":	4,
	"tease":	4,
	"tattle":	6,
	"timeout":	10,
	"leave":	12
};
  
SFGame.DAMAGE_LOLLY = -2;			// gain from licking lolly
SFGame.DAMAGE_TATTLE = 3;			// damage to opponents from successful tattle
SFGame.DAMAGE_FAILED_TATTLE = 3;	// damage to tattlers from failed tattle (more than one tattle in same turn)
SFGame.DAMAGE_COWER_SCARED = 1;		// for cowering unproductively twice in a row
SFGame.DAMAGE_SCRATCH = 1;			// for being scratched (per scratcher)
SFGame.DAMAGE_LOLLY_SCRATCH	= 2,	// for being scratched while trying to lick a lolly (per scratcher)
SFGame.DAMAGE_GRAB = 1;				// for being grabbed (per grabber)
SFGame.DAMAGE_GRAB_SCRATCH = 2;		// scratched while grabbed (per scratcher)
SFGame.DAMAGE_TEASE_ADD = 0;		// 
SFGame.DAMAGE_TEASE_MULT = 2,		// tease damage is 0 if 1 attacker, else ADD+MULT*(# of attackers)
SFGame.DAMAGE_TIMEOUT = 1,			// for not choosing an action (or sending an invalid action)

SFGame.MAX_HEALTH = 10;				// most possible health points


SFGame.HUMILIATION_TEXTS = [
	" was totally embarassed and lost all her self-esteem. She has to sit out for the rest of the game!",
	" couldn't take it any more and collapsed into sobs! With no self-esteem left, she's out of the game!",
	" broke down into a bawling crybaby from being humiliated so much! And the game went on..."
];


// user leaves game in progress
SFGame.prototype.leave = function(conn) {
	var leaver = this.players[conn.user.id];
	if (leaver) {
		leaver.zombie = true;
		//leaver.action = 'leave';
		this.act(conn, {action:'leave'});
	}
}

// utility: broadcast game event with type and args
SFGame.prototype.gameEvent = function(type, args) {
	this.gameroom.broadcast('gameEvent', _.assign({event:type}, args));
}


// user plays a game action
//   in-game actions: cower, lolly, tattle, timeout, scratch, grab, tease
//		scratch, grab, and tease come with target:id of player being s/g/t 
SFGame.prototype.act = function(conn, data) {
	if (this.state != 'await actions') return;
	
	var actorInfo = this.players[conn.user.id];
	if (!actorInfo) {
		console.log('SFGame.act - connection user seems not to be in game', this.gameroom.name, this.gameroom.id, conn.user);
		return;
	}
	
	// record the action - new actions replace old ones - except timeout, which is also recorded separately.
	if (data.action=='leave') {
		// leave should also set timeout so turn doesn't hang up waiting for departed player's timeout
		actorInfo.action = 'leave';
		actorInfo.timeout = true;
	}
	if (data.action=='timeout') {
		actorInfo.timeout = true;
		if (!actorInfo.action) actorInfo.action = 'timeout';
	}
	else {
		actorInfo.action = data.action;
		// check that transitive actions have valid target
		if (data.action=='scratch'||data.action=='grab'||data.action=='tease') {
			var targetInfo = this.players[data.target];
			// check that target is valid and hasn't left the room (someone who left during this turn will still be a valid target)
			if (targetInfo) {
				// check that target isn't self
				if (data.target == conn.id) {
					// someone's messin' with me!  Turn action into timeout.
					actorInfo.action = 'timeout';	
				}
				else {
					actorInfo.target = data.target;
				}
			} 
			else { 
				// couldn't get target
				console.log('SFGame.act - action target user seems to be missing or not in game', this.gameroom.name, this.gameroom.id, data);
				// substitute timeout for bad action
				actorInfo.action = 'timeout';
			}
		}
	}
	// if everyone has reached timeout (can't find any player with timeout=false), turn is over!
	if (!_.find(this.players, {timeout:false})) {
		this.resolveTurn();
	}
	// otherwise, if everyone has acted (can't find any player with no action), go to final countdown 
	else if (!_.find(this.players, {action:false})) {
		this.gameEvent('countdown', {time:SFGame.COUNTDOWN_TIME});
	}

}

// called by SetTimeout if 
SFGame.prototype.overrideTimeout = function() {
	if (this.overrideTimer) {
		clearTimeout(this.overrideTimer);
		this.overrideTimer = undefined;
	}
	console.log('SFGame.overrideTimeout: had to force a timeout in ', this.gameroom.name, this.gameroom.id);
	// whoever didn't check in, give them a timeout action
	_.each(this.players, function(playerInfo){if (!playerInfo.action) playerInfo.action='timeout'});
	// and resolve the turn
	this.resolveTurn();
}


// status message has arg status:{[userid]:{health:[health]}...}
SFGame.prototype.broadcastStatus = function() {
	var statusEvent = {};
	_.each(this.players, function(info, id) {statusEvent[id] = {health:info.health}}, this);
	this.gameEvent('status', {status:statusEvent}); 
}



SFGame.prototype.prepareGame = function() {
	_.each(this.gameroom.occupants, function(conn) {
		this.players[conn.user.id] = _.clone(SFGame.INITIAL_STATUS);
		this.players[conn.user.id].id = conn.user.id;
		this.players[conn.user.id].nickname= conn.user.nickname;
		
	}, this);
}


SFGame.prototype.startGame = function() {
	this.gameEvent('startGame');
}


SFGame.prototype.startTurn = function() {
	var game=this;
	// reset player per-turn info, and copy players who left into zombies list
	_.each(this.players, function(info, id) {
		info.action = false; 
		info.target = undefined;
		info.timeout = false;
		
		if (info.zombie) this.zombies.push(info);
	}, this);
	// now remove the zombies from players
	_.forOwn(this.zombies, function(zombie){ delete this.players[zombie.id]}, this);
	
	
	
	// set the override timer
	if (this.overrideTimer) clearTimeout(this.overrideTimer);
	//this.overrideTimer = setTimeout(this.overrideTimeout.bind(this), 1000 * SFGame.OVERRIDE_TIME);
	// TODO: make sure overrideTimer is ok and then turn it back on
	
	
	this.gameEvent('startTurn', {
		time:SFGame.TURN_TIME, 
		lollies:function(conn){return game.players[conn.user.id].lollies}, 
		tattles:function(conn){return game.players[conn.user.id].tattles}
	});
}


SFGame.prototype.resolveTurn = function() {
	if (this.overrideTimer) {
		clearTimeout(this.overrideTimer);
		this.overrideTimer = undefined;
	}
	
	// list of resolved turn events
	//	narrative entry: {
	//		scene: int,			// scene number is a holdover from early prototypes, keeping it for nostalgia's sake
	//		text: string,		// descriptive caption for the scene
	//		code: ???,			// structured description of scene for rendering
	//		damage: {id:int,...}	// hashes userids to amount of damage they took in this scene			
	//  }
	var narrative = [];
	
	// make ordered list of playerInfos
	var actions = [];

	try {
		this.resolveTurnStage1(narrative, actions);
		this.resolveTurnStage2(narrative, actions);
		
	}
	catch (err) {
		console.log('game resolution error '+err, err.stack);
		narrative.push({
			scene: 0,
			text: "Server broke down like a crybaby: " + err.stack.split('\n').slice(0,3).join(', ').replace(/\s+/g, ' '),
			code: null,
			damage: {}
		});
	}
	
	this.gameEvent('endTurn', {results:narrative});
	this.broadcastStatus();

	this.startTurn()
}


// FIRST PASS: scan actions in order and set up relationships between them	
SFGame.prototype.resolveTurnStage1 = function(narrative, actions) {

	// copy players into actions list and reset all the turn resolution data
	_.each(this.players, function(playerInfo){ 
		this.resetTurnResolution(playerInfo);
		actions.push(playerInfo)
	}, this);
	
	// convert action targets from userIDs to references to other players in this array
	//   and add sort order for sorting
	_.each(actions, function(playerInfo) { 
		// target should always be valid, because we tested it in SFGame.act()
		if (playerInfo.target) playerInfo.target = _.findWhere(actions, {id:playerInfo.target});

		playerInfo.sortOrder = SFGame.ACTION_ORDER[playerInfo.action];
		if (!playerInfo.sortOrder) playerInfo.sortOrder = 1000; // invalid actions get sorted to end
		playerInfo.sortOrder += Math.random();		// add random jitter so identical moves get ordered unpredictably
	}, this);

	actions = _.sortBy(actions, 'sortOrder');
	
	_.each(actions, function(act){this.testActionStage1(narrative, act)}, this);
}


// reset all the properties used in turn resolution
SFGame.prototype.resetTurnResolution = function(act) {
	act.cowering = false;
	act.scratched = false;
	act.grabbed = false;
	act.timeout = false;
	act.licking = false;
	act.lostlolly = false;
	act.tattling = false;
	act.resolved = false;
	act.scratchers = [];
	act.grabbers = [];
	act.teasers = [];
	act.interrupted = null;
	// cowardice is not reset, since it's persistent between turns
}

SFGame.prototype.testActionStage1 = function(narrative, act) {
	
	// COWER: target avoids one grab or scratch
	if (act.action=='cower') {
		act.cowering = true;
		// cowering isn't resolved until/unless someone attacks.
	}
	// end COWER
	
	
	// GRAB: target cannot take any action except cower or tattle.
	//  target receives 1 pt damage for each grab after first.
	//  In resolving grabs, the first resolved grab could 
	//    interrupt its target's grab.
	else if (act.action=='grab') {
		// has grabber been grabbed already?
		if (act.grabbed) {
			// record interruption
			act.interrupted = 'grab ' + act.target.nickname;
			// this action is resolved.
			act.resolved = true;
		}
		
		// grabber hasn't been grabbed already
		else {
			// does target have a cower that hasn't been used up?
			if (act.target.cowering && !act.target.resolved) {
				// log a scene 4: cowering from grab
				narrative.push({
					scene: 4,
					text: act.nickname + " tried to grab " + act.target.nickname + " but she cowered away.",
					code: null, // TODO
					damage: {}
				})
				
				// both the cower and the grab are resolved
				act.target.resolved = true;
				act.resolved = true;
			}
			
			// target not cowering
			else {
				// note a successful grab (but not fully resolved yet)
				act.target.grabbed = true;
				act.target.grabbers.push(act);
			}
		}
	}
	// end GRAB
	
	// SCRATCH: target receives 1 damage, or 2 if grabbed.
	else if (act.action=='scratch') {
		// has scratcher been grabbed already?
		if (act.grabbed) {
			// scratcher's scratch was interrupted
			act.interrupted = 'scratch ' + act.target.nickname;
			// this action is resolved
			act.resolved = true;
		}
		
		// scratcher wasn't grabbed
		else {
			// does target have a cower that hasn't been used up?
			if (act.target.cowering && !act.target.resolved) {
				// log a scene 5: cowering from scratch
				narrative.push({
					scene: 5,
					text: act.nickname + " tried to scratch " + act.target.nickname + " but she cowered away.",
					code: null, // TODO
					damage: {}
				});
				// both original cower and this scratch are resolved.
				act.target.resolved = true;
				act.resolved = true;
			}
			// target not cowering
			else {
				act.target.scratched = true;
				act.target.scratchers.push(act);
			}
		}
		
	}
	// end SCRATCH
	
	
	// TEASE: target receives damage according to # of teasers
	//  if only 1 teaser, tease fails; no damage.
	else if (act.action=='tease') {
		// has teaser been grabbed already?
		if (act.grabbed) {
			// teaser's tease was interrupted
			act.interrupted = "tease " + act.target.nickname;
			// the action is resolved.
			act.resolved = true;
		}
		// teaser wasn't grabbed, tease goes through
		else {
			act.target.teasers.push(act);
		}
	}
	// end TEASE
	
	
	// LICK LOLLY: if subject is scratched, lick fails+double damage
	//   successful licker has damage reduced by SFGame.DAMAGE_LOLLY
	//   successful licker is immune to tattles
	//   Each player may lick only SFGame.INITIAL_STATUS.lollies times per game
	//      (enforced by client as well)
	// don't check for interrupted by grab here; will resolve it during grab scene.
	else if (act.action=='lick') {
		// in case of cheating client, check that subject still has lollies left
		if (act.lollies==0) {
			act.action = 'timeout';  // convert illegal lick to timeout
			act.timeout = true;
		}
		else {
			// use up a lolly
			act.lollies--;
			act.licking = true;
		}
	}
	// end LICK
	
	
	
	// TATTLE: if 1 player tattles, all other non-licking players get DAMAGE_TATTLE damage.
	//   If more than 1 player tattles, all tattlers get DAMAGE_FAILED_TATTLE damage.
	//   Each player may tattle only SFGame.INITIAL_STATUS.tattles times per game
	else if (act.action=='tattle') {
		// in case of cheating client, check if tattles used up
		if (act.tattles == 0) {
			act.action = 'timeout';
			act.idling = true;
		}
		else {
			act.tattles--;
			act.tattling = true;
		}
	} // end TATTLE

}



// SECOND PASS
// resolve unresolved actions into narrative scenes
// (only scenes 4 and 5 have already been found during stage 1)
SFGame.prototype.resolveTurnStage2 = function(narrative, actions) {
	
	// look for SCENE 1: unproductive cowering alone 

	// need to know if there was a successful tattle now to decide if cower was productive
	// compute # of tattlers
	var tattleSize = _.where(actions, {action:'tattle'}).length;
	var successfulTattle = (tattleSize==1);
	
	// find unresolved cowers
	var cowerers = _.where(actions, {action:'cower', resolved:false});
	
	// reset cowardice counter for those who didn't cower or cowered productively
	_.each(actions, function(act) {if (act.action != 'cower' || act.resolved) act.cowardice = 0 });
	
	// create a scene 1 for each unproductive cowerer.
	// cowerers contains only those who were not grabbed or scratched (those were resolved in the first pass), so to resolve SCARED 
	//   we only need to take successfulTattle into account.
	_.each(cowerers, function(cow) {
		cow.resolved = true;
		if (successfulTattle) {
			cow.cowardice = 0;
			narrative.push({
				scene: 1,
				text: cow.nickname + " cowered and looked innocent while the other girls fought.",
				code: null, // TODO
				damage: {}
			});
		}
		// no successful tattle
		else {
			if (!cow.cowardice) {
				// first unproductive cower
				cow.cowardice = 1;
				narrative.push({
					scene: 1,
					text: cow.nickname + " cowered from nothing like a scaredy-cat.  If she does that again next turn, she's gonna be sorry!",
					code: null, // TODO
					damage: {}
				});
			}
			else {
				// second unproductive cower
				// cow.cowardice = 0;
				var damage = {};
				damage[cow.id] = SFGame.DAMAGE_COWER_SCARED;
				narrative.push({
					scene: 1,
					text: cow.nickname + " cowered again for no reason! She feels like a little wimp and loses self-esteem.",
					code: null, // TODO
					damage: damage
				})
				
			}
		}
	}, this);
	
	
	
	// look for SCENE 26, mutual scratch
	// a scratch b, b scratch a, no lollies (must be true if a<->b)
	// and nobody else scratching or grabbing either one
	_.each(actions, function(act) {
		if (act.action=='scratch' && !act.resolved
				&& act.target.action=='scratch'
				&& act.target.target==act && !act.target.resolved
				&& act.scratchers.length==1 && act.target.scratchers.length==1
				&& act.grabbers.length==0 && act.target.grabbers.length==0) {
			// this resolves both scratches
			act.resolved = true;
			act.target.resolved = true;
			
			var damage = {};
			damage[act.id] = SFGame.DAMAGE_SCRATCH;
			damage[act.target.id] = SFGame.DAMAGE_SCRATCH;
			narrative.push({
				scene: 26,
				text: act.nickname + " and " + act.target.nickname + " scratched each other.",
				code: null, // TODO
				damage: damage
			});
		}
			
	}, this);
	
	
	// SCENES 2-13: Scratch and/or grab with optional lolly
	
	// Find players that have been scratched and/or grabbed
	_.each(actions, function(victim) {
		if (victim.scratchers.length > 0 || victim.grabbers.length > 0) {
			// Remove any scratchers/grabbers that are already resolved, just to be safe, though there should be none:
			_.remove(victim.scratchers, 'resolved');
			_.remove(victim.grabbers, 'resolved');
			
			// resolve those which remain
			_.each(victim.scratchers, function(scratcher) {
				scratcher.resolved = true;
			}, this);
			_.each(victim.grabbers, function(grabber) {
				grabber.resolved = true;
			}, this);
			
			// just in case they all got removed:
			if (victim.scratchers.length==0 && victim.grabbers.length==0) {
				// nothing!
			}
			else {
			
				// OK, you have a player who has been grabbed and/or scratched by at least one attacker.
				
				// If player had a lolly, it's gone now!
				victim.lostLolly = true;
				
				// divide scenes up based on scratch/grab/lick
				if (victim.licking) {
					// lolly cases 
					// being scratched/grabbed caused me to lose my lolly
					
					// Lolly cases don't need to worry about the victim.interrupted
					// field, since we know it was a lick that was interrupted.
					// Stage 1 lick doesn't get resolved on grab/scratch so resolve here:
					victim.resolved = true;
					
					if (victim.grabbers.length==0) {
						// lolly + scratch
						var scene = (victim.scratchers.length > 1) ? 12 : 11;
						var damage = {};
						damage[victim.id] = victim.scratchers.length * SFGame.DAMAGE_LOLLY_SCRATCH;
						narrative.push({
							scene: scene,
							text: _.pluck(victim.scratchers, 'nickname').join(' and ') + ' scratched ' + victim.nickname + " and she choked on her lollipop, suffering extra humiliation.",
							code: null, // TODO
							damage: damage
						});
					}
					
					else if (victim.scratchers.length==0) {
						// lolly + grab
						var scene = (victim.grabbers.length > 1) ? 7 : 6;
						var damage = {};
						damage[victim.id] = (victim.grabbers.length-1) * SFGame.DAMAGE_GRAB;
						narrative.push({
							scene: scene,
							text: _.pluck(victim.grabbers, 'nickname').join(' and ') + ' grabbed ' + victim.nickname + " and she couldn't lick her lollipop.",
							code: null, // TODO
							damage: damage
						});
					}
					
					else {
						// lolly + grab & scratch
						var damage = {};
						damage[victim.id] = victim.scratchers.length * SFGame.DAMAGE_GRAB_SCRATCH + (victim.grabbers.length-1) * SFGame.DAMAGE_GRAB;
						narrative.push({
							scene: 13,
							text: _.pluck(victim.grabbers, 'nickname').join(' and ') + ' grabbed ' + victim.nickname 
								+ ' and ' + _.pluck(victim.scratchers, 'nickname').join(' and ') + ' scratched her.  She never got to lick her lollipop.',
							code: null, // TODO
							damage: damage
						})
					}
				}
				else {
					// No lolly - similar to three scenes above but without lolly
					
					if (victim.grabbers.length==0) {
						// just scratch
						var scene = (victim.scratchers.length > 1) ? 9 : 8;
						var damage = {};
						damage[victim.id] = victim.scratchers.length * SFGame.DAMAGE_SCRATCH;
						narrative.push({
							scene: scene,
							text: _.pluck(victim.scratchers, 'nickname').join(' and ') + ' scratched ' + victim.nickname + ".",
							code: null, // TODO
							damage: damage
						});
					}
					
					else if (victim.scratchers.length==0) {
						// just grab
						var scene = (victim.grabbers.length > 1) ? 3 : 2;
						var damage = {};
						damage[victim.id] = (victim.grabbers.length-1) * SFGame.DAMAGE_GRAB;
						var text='';
						if (victim.interrupted) {
							text = victim.nickname+" was going to "+victim.interrupted+" but "
						}
						text += _.pluck(victim.grabbers, 'nickname').join(' and ') + ' grabbed ' + victim.nickname + "."
						narrative.push({
							scene: scene,
							text: text,
							code: null, // TODO
							damage: damage
						});
					}
					
					else {
						// grab & scratch
						var damage = {};
						damage[victim.id] = victim.scratchers.length * SFGame.DAMAGE_GRAB_SCRATCH + SFGame.DAMAGE_GRAB * (victim.grabbers.length-1);
						narrative.push({
							scene: 10,
							text: _.pluck(victim.grabbers, 'nickname').join(' and ') + ' grabbed ' + victim.nickname 
								+ ' and ' + _.pluck(victim.scratchers, 'nickname').join(' and ') + ' scratched her.',
							code: null, // TODO
							damage: damage
						})
					}				
				} // end lolly/no lolly switch
			} // end test: has remaining grabbers/scratchers after cleanup
		} // end test: has grabbers and/or scratchers
		
	}, this); // end loop
	// END SCENES 2-13
	
	
	// SCENE 14: mutual failed tease
	//   p1 teases p2 and p2 teases p1, no other teases on either one
	_.each(actions, function(p1) {
		if (p1.action=='tease' && p1.teasers.length==1 && !p1.resolved
				&& p1.target.action=='tease' && p1.target.teasers.length==1 && !p1.target.resolved
				&& p1.target.target == p1) {
			p1.resolved = true;
			p1.target.resolved = true;
			
			narrative.push({
				scene: 14,
				text: p1.nickname + " and " + p1.target.nickname + " teased each other. But nobody else joined in, so it didn't work.",
				code: null, //TODO
				damage: {}
			});	
		}
			
	});
	// END SCENE 14
	
	
	// SCENE 15, failed tease (only one teaser)
	// SCENE 16, successful tease (more than one teaser)
	_.each(actions, function(victim) {
		if (victim.teasers.length >= 1) {
			// remove any teases that are already resolved -- end if none left
			_.remove(victim.teasers, 'resolved');
		}
		if (victim.teasers.length >= 1) {
			// mark teasers as resolved
			_.each(victim.teasers, function(teaser) {
				teaser.resolved = true;
			});
		
			var text =_.pluck(victim.teasers, 'nickname').join(" and ") + " teased " + victim.nickname + ".";
			var scene;
			var damage;
			
			// it takes 2 or more teasers for a successful tease
			if (victim.teasers.length == 1) {
				// 1 teaser: tease failed
				scene = 15;
				text += " But nobody else joined in, so it didn't work.",
				damage = {};
			}
			else {
				// > 1 teaser: tease succeeded
				scene = 16;
				damage = {};
				damage[victim.id] = SFGame.DAMAGE_TEASE_ADD + SFGame.DAMAGE_TEASE_MULT * victim.teasers.length;
			}
			
			narrative.push({
				scene: scene,
				text: text,
				code: null, // TODO
				damage: damage
			});
		}
	});
	// END SCENE 15/16
	
	
	// SCENE 17: successful tattle (one tattler) - licking and cowering are defense against tattle
	// SCENE 18: failed tattle (more than one tattler)
	var tattlers = [], lickers = [], cowerers = [], sufferers = []; // sufferers are everyone else - those without defense against tattle
	var damage = {};
	var text = "";
	var code = null; // TODO!
	_.each(actions, function(player) {
		if (player.action=='tattle') tattlers.push(player);
		else if (player.action=='lick') lickers.push(player);
		else if (player.action=='cower') cowerers.push(player);
		else sufferers.push(player);
	}, this);
	
	if (tattlers.length==1) {
		// scene 17 successful tattle
		_.each(sufferers, function(sufferer) {
			damage[sufferer.id] = SFGame.DAMAGE_TATTLE;
		}, this);
		
		text = tattlers[0].nickname + " tattled! ";
		
		if (sufferers.length > 0) {
			text += _.pluck(sufferers, 'nickname').join(' and ') + ' got in trouble. ';
		}
		
		var lick_cowerers = lickers.concat(cowerers);
		if (lick_cowerers.length > 0) {
			text += _.pluck(lick_cowerers, 'nickname').join(' and ') + " looked innocent."
		}
		
		narrative.push({
			scene: 17,
			text: text,
			code: code,
			damage: damage
		});
	}
	else if (tattlers.length > 1) {
		// scene 18: failed tattle
		text = _.pluck(tattlers, 'nickname').join(' and ') + ' all tattled and got themselves in trouble!';
		_.each(tattlers, function(tattler) {
			damage[tattler.id] = SFGame.DAMAGE_FAILED_TATTLE;
		}, this);
		code = null; // TODO!!!
		
		narrative.push({
			scene: 18,
			text: text,
			code: code,
			damage: damage
		})
	}
	// END SCENE 17/18
	
	
	
	// SCENE 19: lick lolly
	var lickers = [], damage = {};
	_.each(actions, function(player) {
		if (player.action=='lick' && !player.resolved && !player.lostLolly) {
			lickers.push(player);
			damage[player.id] = SFGame.DAMAGE_LOLLY; // negative damage for lolly benefits!
		}
	}, this);
	if (lickers.length > 0) {
		var text;
		if (lickers.length==1) {
			text = lickers[0].nickname + " licked her lollipop and felt better.";
		}
		else {
			text = _.pluck(lickers, 'nickname').join(' and ') + " all licked their lollipops and felt better.";
		}
		narrative.push({
			scene: 19,
			text: text,
			code: null, // TODO
			damage: damage
		});
	}
	// END SCENE 19
	
	
	
	// SCENE 22 timeout, 27 leave - instead of grouping, make one scene per timeout / leave
	_.each(actions, function(player) {
		if (player.action=='timeout') {
			var damage = {};
			damage[player.id] = SFGame.DAMAGE_TIMEOUT;

			narrative.push({
				scene: 22,
				text: player.nickname + " couldn't make up her mind what to do. How humiliating!",
				code: null, // TODO!
				damage: damage
			});
		}
		else if (player.action=='leave') {
			narrative.push({
				scene: 27,
				text: player.nickname + " ran away like a big loser.",
				code: null, //TODO!
				damage: {}
			});
		}
	}, this);
	// END SCENE 22/27
	
	
	// SCENE 20: humiliation
	// Count up total damage and find out who's out of the game
	
	// make temporary copy of narration so we can iterate through it without modifying
	var temp_narr = _.clone(narrative);
	_.each(temp_narr, function(item){
		if (_.keys(item.damage).length > 0) {
			_.each(item.damage, function(penalty, playerID) {
				// skip the calculation if if player is already at 0
				var player = this.players[playerID];
				if (player && player.health > 0) {
					player.health -= penalty;
					if (player.health < 0) player.health = 0;
					if (player.health > SFGame.MAX_HEALTH) player.health = SFGame.MAX_HEALTH;
				}
				
				if (player.health==0) {
					// if newly humiliated, make a scene
					narrative.push({
						scene: 20,
						text: _.sample(SFGame.HUMILIATION_TEXTS),
						code: null, // TODO
						damage: {}
					});
				}
				
			}, this);
		}
	}, this);
	
	
} // end resolveTurnStage2




module.exports = SFGame;