# sissyfight messages

Stuff that gets sent over the socket between client and server.  

Server-to-client messages usually have, in additional to their other data (if any), error and message arguments.  
Error will be false or undefined if there's no error, but if there was an error, error will be a short string 
unique to that error (in case we need some sort of lookup table on the client), and message will be a description
of the error (for debugging, probably not for end user).

Server messages **go** and **error** have lots of variations, see below.

## login

*	**login** (up)

	args: **token**: string, **session**: string - authentication info supplied by the hosting web page
	
	error reply:
	
*	**error{where=login}** (down)

	errors:
	* tsnotsupp: didn't supply token and/or session
	* nostore: couldn't access session store (problem with redis?)
	* nosession: no such session id
	* notlogged: session exists but isn't logged in
	* token: token doesn't match
	* multi: user is already connected via another socket
	* dbusererr: couldn't access user database (problem with mysql?)
	* dbnouser: no such user id (probably can't happen)
	* noschool: bad or missing school id in user session
	
	A successful login will reply with go{to=dressingroom}
	
## dressing room

*	**go{to=dressingroom}** (down)
	args: nickname, avatar - avatar is {} if it's never been set
	
*	**saveAvatar** (up) -

	args: **avatar** (object)
	
	error reply:

*	**error{where=avatar}** (down) -
	errors:
	* badavatar: (*not yet implemented*) Badly formatted avatar object or item out of range, including don't have permission to use item - might split these off into different errors
	* dbaverr: couldn't save to database (problem with mysql?)
	* plus some of the loginError errors.
	
	A successful saveAvatar will reply with go{to=homeroom}

## chat room (homeroom)
	
*	**go{to=homeroom}** (down)

	args: **room**: {**room** (room id), **roomName**, **occupants**:array of {id, nickname}}, **games**:array of game rooms, see game below
	
	**error{where=homeroom}** ...errors that could happen if saveAvatar succeeded but couldn't enter homeroom. With luck, none of these will ever happen.
	errors:
	* duplicate: user is already in this room
	* notlogged: socket not logged in (from here down hopefully can never happen)
	* noschool: socket has no or unknown school	
	* inaroom: already in some room (need to leave first)
	* nohomeroom: couldn't get homeroom from school
	* joinhomeroom: couldn't join homeroom
	

*	**join** (down: broadcast)

	args: **nickname** of user who just joined, **room** id.
	
*	**leave** (down: broadcast)

	args: **nickname** of user who just left, **room** id.
	
*	**say**	(up)

	args: **text** to say
	
*	**say** (down: broadcast)

	args: **nickname**, **text**, **room** id.

*	**dressingRoom** (up) - request to return to dressing room

	args: none
	
*	**newgame** (up) - request to create a new game room
	
	args: **name** (might add in future: password, rule variations)
	
* 	error reply:

	**error{where=newgame}**
	
	errors:
	* toomany	- already too many game rooms
	* nameinuse	- that name's already in use
	
	
*	**joingame** (up) - request to join a game room

	args: **room** (might add in future: password)
	
*	error reply:	

	**error{where=joingame,id=id}** ...
	
	errors:
	* gone (room was just deleted)
	* full
	* playing
	* (blocked, badpassword ... might add in future)
	
*	**go{to=gameroom}** (down)

	args: **me** (player userID so client can tell which occupant is me without any memory), **room**:{same as args of **game** below}
	
*	**gameUpdate** (down: broadcast) indicates new or deleted game room or updates existing game room

	args: **update** = start, destroy, occupants, or status,
	**roomInfo** = {room (id), roomName, occupants:[], status} where status=open, full, or fighting

## game room

*	**homeroom** (up) - request to exit game back to homeroom

*	**act** (up) - game action

	args: **action** -- boot, start, cower, lolly, tattle, timeout, scratch, grab, tease
	**target** -- id of target player for boot, scratch, grab, tease actions
	
*	**gameEvent** (down: broadcast)
	
	args: **event** = booted(target=user id), startGame, status([player health]}, startTurn(time=seconds, lollies=#, tattles=#), countdown(time=seconds), acted(id=user id), endTurn(results=[...])
	
