# sissyfight messages

Stuff that gets sent over the socket between client and server.  

Server-to-client messages usually have, in additional to their other data (if any), error and message arguments.  
Error will be false or undefined if there's no error, but if there was an error, error will be a short string 
unique to that error (in case we need some sort of lookup table on the client), and message will be a description
of the error (for debugging, probably not for end user).

## login

*	**login** (up)

	args: **token**: string, **session**: string - authentication info supplied by the hosting web page
	
	reply:
	
*	**login** (down)

	args: **nickname**:string, **avatar**:object - avatar is {} if it's never been set
	
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
	
## dressing room

*	**getAvatar** (up)

	reply:
	
*	**avatar** (down)

	args: **avatar** (object) - avatar is {} if it's never been set
	
	errors:
	* notlogged: not logged in (maybe user logged out of web site without closing the game?)
	
*	**setAvatar** (up)

	args: **avatar** (object)
	
	reply:

*	**avatar** (down) - same as above with more possible errors:
	errors:
	* badavatar: (*not yet implemented*) Badly formatted avatar object or item out of range, including don't have permission to use item - might split these off into different errors
	* dbaverr: couldn't save to database (problem with mysql?)

## chat room (lobby/homeroom)

Special case: message homeroom for joining homeroom

*	**homeroom** (up)

	reply:
	
*	**homeroom** (down)

	args: **room** (room id), **roomName**, **occupants**:array of nicknames
	
	errors:
	* duplicate: user is already in this room
	* notlogged: socket not logged in (from here down hopefully can never happen)
	* noschool: socket has no or unknown school	
	* inaroom: already in some room (need to leave first)
	* nohomeroom: couldn't get homeroom from school
	* joinhomeroom: couldn't join homeroom
	
	
	
	broadcast:

*	**join** (down)

	args: **nickname** of user who just joined.
	
*	**leave** (up)

	args: none
	
	reply:

*	**left** (down)

	args: none
	
	errors: 
	* nothere: user wasn't in this room
		
	broadcast:
	
*	**leave** (down)

	args: **nickname** of user who just left.
	
*	**say**	(up)

	args: **text** to say
	
	broadcast:
	
*	**say** (down)

	args: **nickname**, **text**

	

## game rooms 
	

*	**join** (up)

	args: **room** (room id)

	...same as homeroom(up) above
	
*	**joined** (down)

	...same as homeroom(down) above
	
	errors: as homeroom above, plus:
	* nosuchroom: no such room

*	**say**(up/down), **leave**(up/down), **left**(down) same as homeroom above 

	

	
