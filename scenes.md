# sissyfight game narrative scenes
with example of scene name and scene description from server (the 'code' component of scene object)

* 1: cowering alone successfully or for no reason (1 cowerer per scene)
	cower, {victim:123, cower:'penalty', from:null, attacker:null} // good, useless, or penalty
* 2: grabbed by one, no lolly
	grabscratch, {grabbers: [123], victim: 789, lolly:none}
* 3: grabbed by more than one, no lolly
	grabscratch, {grabbers: [123, 456], victim: 789, lolly:none}
* 4: cowering from grab
	cower, {victim:123, cower:'good', from:'grab', attacker:456}
* 5: cowering from scratch
	cower, {victim:123, cower:'good', from:'scratch', attacker:456}
* 6: grabbed by one while licking lolly
	grabscratch, {grabbers: [123], victim: 789, lolly:grab}
* 7: grabbed by more than one while licking lolly
	grabscratch, {grabbers: [123, 456], victim: 789, lolly:grab}
* 8: scratched by one, no lolly
	grabscratch, {grabbers: [123], victim: 789, lolly:none}
* 9: scratched by more than one, no lolly
	grabscratch, {grabbers: [123, 456], victim: 789, lolly:none}
* 10: grabbed and scratched, no lolly
	grabscratch, {grabbers: [123, 456], scratchers: [321, 654], victim: 789, lolly:none}
* 11: scratched by one while licking lolly
	grabscratch, {scratchers: [123], victim: 789, lolly:scratch}
* 12: scratched by more than one while licking lolly
	grabscratch, {scratchers: [123, 456], victim: 789, lolly:scratch}
* 13: grabbed and scratched while licking lolly
	grabscratch, {grabbers: [123, 456], scratchers: [321, 654], victim: 789, lolly:grab}
* 14: failed mutual tease (always two)
	mutualtease, {teasers: [123, 456]}
* 15: failed tease (only one teaser)
	tease, {victim: 123, teasers:[456], teased:false}
* 16: successful tease (more than one teaser)
	tease, {victim: 123, teasers:[456, 789], teased:true}
* 17: successful tattle (only one tattler)
	tattle, {tattler:123, victims:[456, 789], innocents:[234,567]}
* 18: failed tattle (more than one tattler)
	failedtattle, {tattlers:[123,456]}
* 19: lick lolly (one or more players)
	lolly, {lickers:[123, 456]}
* 20: humiliation
	humiliated, {loser: 123}
* 21: *list of survivors (not used)*
* 22: timeout (didn't choose action before end of turn)
	timeout, {loser: 123}
* 23: **game over, no winners**
* 24: **game over, one winner**
* 25: **game over, two winners**
	end, {winners:[123, 456]} or {winners:[]}
* 26: mutual scratch
	mutualscratch, {scratchers:[123, 456]}
* 27: leave the room
	leave, {loser: 123}