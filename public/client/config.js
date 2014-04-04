config = {};

config['avatar'] = {};
var xoffset = 40;

// which school-specific art to load?
// get school tag from the school ID set by enclosing page
//   eg. 666 -> 666, but angel-2 -> angel
var SCHOOL_ASSETS_TAG = g.schoolID.split('-')[0]; 

// specify single font to use same font in both, or [single size font, double size font]
var defaultFont = 'resourcepix'; // optimum 13px
var computerFont = 'VT323'
config['fonts'] = {
	dressingRoomAddons:		'10px ' + computerFont,
	dressingRoomNickname:	'16px ' + defaultFont,
	
	homeroomAttendance:		'12px ' + computerFont,
	homeroomAttendanceCount:'10px ' + computerFont,
	homeroomRoomName:		'16px ' + defaultFont,
	homeroomPlayerName:		'16px ' + defaultFont,
	
	cueText:				'16px ' + defaultFont,
	
	gameResultsChalkboard:	'16px '	+ defaultFont,
	gameRoomGameName:		'16px ' + defaultFont,
	gamePlayerName:			'16px ' + defaultFont,
	gamePlayerNameSmall:	'16px ' + defaultFont,
	
	polaroidDamage:			'32px ' + defaultFont
}
config.getFont = function(tag) {
	var f = config.fonts[tag];
	var r = "";
	if (typeof f == 'object') {
		if (g.gameScale==2) r = f[1]; // todo: MAKE THIS WORK (g is not accessible here)
		else r = f[0];
	}
	r = f;
	
	//console.log("font for "+ tag + ": " + r);
	return r;
}

config['assetPath'] = '../client/assets/';

config['preloadManifest'] = [
	{
		id: 	'preload_bg',
		src:	'loading/loading_main.png'
	},
	{
		id:		'preload_tapping',
		src:	'loading/tapping.png',
		data:	{
			sheet: {
				frames: {width:50, height:54},
				animations: {'tap': {frames: [0,0,0,0,1,2,3,4,5,6,7], frequency:2 }}
			}
			
		}
	}
]

config['manifest'] = [
	// audio
	//	- music (different per school)
	{	id:		'music_intro',		src: 'music/' + SCHOOL_ASSETS_TAG + '/intro.ogg'	},
	{	id:		'music_polaroid',	src: 'music/' + SCHOOL_ASSETS_TAG + '/polaroid.ogg'	},
	{	id:		'music_winner',		src: 'music/' + SCHOOL_ASSETS_TAG + '/winner.ogg'	},
	{	id:		'music_loser',		src: 'music/' + SCHOOL_ASSETS_TAG + '/loser.ogg'	},
	//  - sounds (same for all schools)
	{	id:		'snd_click',		src: 'sound/click.ogg'	},
	{	id:		'snd_keyclick',		src: 'sound/keyclick.ogg' },
	{	id:		'snd_action_select',src: 'sound/action-select.ogg'	},
	{	id:		'snd_countdown',	src: 'sound/countdown.ogg'	},
	{	id:		'snd_buzzer',		src: 'sound/buzzer.ogg'	},
	{	id:		'snd_playloop',		src: 'sound/playloop.ogg'	},


	// avatar
	{
		id: 	'faces',
		src:	'avatar/all_faces.png',
		data:	{colors:'skin', grid:[40,50], reg:[-20+xoffset,-14]}
	},
	{
		id: 	'bodies',
		src:	'avatar/all_bods.png',
		data:	{colors:'skin', grid:[81,116], reg:[0+xoffset,9]}
	},
	{
		id:		'hairs',
		src:	'avatar/all_hairs.png',
		data:	{colors:'hair', grid:[65,70], reg:[-1+xoffset,0]}
	},
	{
		id:		'uniforms',
		src:	'avatar/all_uniforms.png',
		data:	{colors:'uniforms', grid:[81,116], reg:[0+xoffset,9]}
	},
	{
		id:		'overlays',
		src:	'avatar/overlays.png',
		data:	{
			pieces:	{
				ovl_tears:		[0,  0,	24,13, 	0, 	22,-42],
				ovl_scratch:	[44, 1,	 8, 8,	0,	 3,-45],
				ovl_choke:		[26, 0,	14,13,	0,	20,-41],
				ovl_lick:		[54, 0,  8, 8,	0,	17,-47],
				ovl_holdlolly:	[64, 0,	16, 8,	0,	 2,-74]
			}
		}
	},


	// dressing room
	{ 	id: 	'dressing_behind', 	src: 'dressing/dressing_behind.png' },
	{ 	id: 	'dressing_frame', 	src: 'dressing/dressing_frame.png' },
	{
		id: 	'dressing_items', 	src: 'dressing/dressing_items.png',
		data: {
			pieces: {
				btn_ok: 			[39,2,  36,23,  0, 0,0], 
				btn_ok_disabled:	[39,29, 36,23,  0, 0,0], 
				btn_ok_pressed:		[39,2,  36,23,  0, -1,-1],
				ptr_skincolor: 		[79,2,  40,45,  0, 9,12], 
				ptr_haircolor:		[86,50, 26,26,  0, -8,10], 
				ptr_addon:			[0, 54, 75,22,  0, 8,6], 
				ptr_addon_disabled:	[0, 85, 75,8,   0, 0,0], 
				lever: 				[20, 1, 19,47,  0, 1,0], 
				lever_pulled:		[0,  1, 19,47,  0, 1,0],
				btn_scroll_up:		[79,80, 21,18,  0, 0,0],
				btn_scroll_up_pressed:		[79,80, 21,18,  0, -1,-1],
				btn_scroll_down:	[101,80,21,18,  0, 0,0],
				btn_scroll_down_pressed:	[101,80,21,18,  0, -1,-1]
			}
		}
	},
	 
	// homeroom 
	{	id:		'homeroom_bg',		src: 'homeroom/homeroom_bg.png'},
	{	id:		'homeroom_items',	src: 'homeroom/homeroom_items.png',
		data:	{
			pieces: {
				btn_dressingroom:			[2, 2,	85,31,	0, 0,0],
				btn_dressingroom_pressed:	[2, 2,	85,31,	0, -1,-1],
				btn_chat:					[89,2,  47,27,  0, 0,0],
				btn_chat_pressed:			[89,2,  47,27,  0, -1,-1],
				
				btn_help:					[64,78,  42, 39, 0, 0, 0],
				btn_help_pressed:			[64,78,  42, 39, 0, -1,-1],
				
				btn_mute:					[32,78,  29, 39, 0, 0, 0],
				btn_mute_pressed:			[32,78,  29, 39, 0, -1,-1],
				btn_mute_on:				[1, 78,  29, 39, 0, 0, 0],
				btn_mute_on_pressed:		[1, 78,  29, 39, 0, -1,-1],
				
				
				btn_creategame:				[2,34,	143,17,	0,	0,0],
				btn_creategame_pressed:		[147,34,143,17,	0,	0,0],
				
				bg_newgame:					[1,57,	198,19,	0,	0,0],
				btn_newgame_cancel:			[200,57,64,21,	0,	0,0],
				btn_newgame_cancel_pressed:	[200,57,64,21,	0,	-1,-1],
				btn_newgame_ok:				[265,52,34,29,	0,	0,5],
				btn_newgame_ok_pressed:		[265,52,34,29,	0,	-1,4],
				
				btn_chalkboard_up:			[138, 2,	21,18,		0,	0,0],
				btn_chalkboard_up_pressed:	[138, 2,	21,18,		0,	-1,-1],
				btn_chalkboard_down:		[161, 2,	21,18,		0,	0,0],
				btn_chalkboard_down_pressed:[161, 2,	21,18,		0,	-1,-1],
				
				attendance_closed:			[214,83,	86,39,		0,	0,0],
				attendance_open:			[302, 1,	86,256,		0,	0,0],
				btn_attendance_open:		[232, 2,	21,18,		0,	0,0],
				btn_attendance_open_pressed:[232, 2,	21,18,		0,	-1,-1],
				btn_attendance_close:		[255, 2,	21,18,		0, 	0,0],
				btn_attendance_close_pressed:[255, 2,	21,18,		0, 	-1,-1],
				btn_attendance_up:			[186, 2,	21,18,		0,	0,0],
				btn_attendance_up_pressed:	[186, 2,	21,18,		0,	-1,-1],
				btn_attendance_down:		[209, 2,	21,18,		0,	0,0],
				btn_attendance_down_pressed:[209, 2,	21,18,		0,	-1,-1],
				
				booted_overlay:				[3, 124,	128,64,		0, 0,0]
			}
		}
	},
	{	id:		'homeroom_listing_items', src: 'homeroom/homeroom_listing_items.png',
		data:	{
			pieces:	{
				label_full:			[1, 2,  30, 7,  0,  -18,-10],
				label_fighting:		[40,2,  62, 7,  0,   -4,-10],
				btn_join:			[1,13,  51, 21, 0,  -13,-1],
				btn_join_pressed:	[53,13, 51, 21, 0,  -13,-1],
				btn_join_locked:	[40,35, 64, 21, 0,   0,-1]
			}
		}
	},
	
	// game room
	{	id:		'gameroom_bgitems',	src: 'game/' + SCHOOL_ASSETS_TAG + '/game_bgitems.png', 
		data:	{
			pieces: {
				gameroom_bg:		[0, 0, 528, 276,   0,  0, 0],
				bubble:				[4,23,  85, 78,    0,  0, 0],
				shadow:				[23,198, 47,12,    0,  0, 0],
				results_bg:			[0, 277, 319, 95,  0,  -6, -6]  // it's really 325px wide but the frame has a 319px opening
			}
		}
	},
	{	id:		'gameroom_items', src: 'game/game_items.png',
		data:	{
			pieces: {
				btn_exitgame:		[0, 37, 79,17, 	0, 0, 0],
				btn_exitgame_pressed:[0, 19, 79,17, 	0, 0, 0],
				btn_help:			[82, 19, 42, 39, 0, 0, 0],
				btn_help_pressed:	[82, 19, 42, 39, 0, -1,-1],
				
				btn_mute:			[350,225,  29, 39, 0, 0, 0],
				btn_mute_pressed:	[350,225,  29, 39, 0, -1,-1],
				btn_mute_on:		[350,185,  29, 39, 0, 0, 0],
				btn_mute_on_pressed:[350,185,  29, 39, 0, -1,-1],
				
				console_pregame:	[0, 122,  528, 54,   0, 0, 0],
				console_game:		[0,  66,  528, 54,   0, 0, 0],
				
				btn_chat:			[535, 47, 47, 27, 0, 0, 0],
				btn_chat_pressed:	[535, 47, 47, 27, 0, -1,-1],
				btn_chat_loud:	[585, 45, 50, 25, 0, 0, 2],
				btn_chat_loud_pressed:	[585, 45, 50, 25, 0, -1, 1],
				btn_chatmode_normal:	[644, 50, 26, 16, 0, 0, 0],
				btn_chatmode_normal_pressed:	[644, 50, 26, 16, 0, -1, -1],
				btn_chatmode_loud:	[674, 49, 26, 17,  0, 0, 1],
				btn_chatmode_loud_pressed:	[674, 49, 26, 17,  0, -1, 0],
				
				
				btn_start:			[591, 78,   56, 32,  0, 0, 0],
				btn_start_pressed:	[531, 77,   56, 32,  0, 0, 0],
				
				boot_menu_bg:		[88, 392,   82, 76,  0, 0, -31],	// offset relative to larger act_menu
				boot_menu_boot:		[98, 469,   62, 15,  0, -10, -38],
				boot_menu_dont:		[99, 490,   62, 23,  0, -11, -59],
				boot_count_1:		[81, 530,   21, 41,  0, 0, 0],
				boot_count_2:		[101, 530,   21, 41,  0, 0, 0],
				boot_count_3:		[121, 530,   21, 41,  0, 0, 0],
				boot_count_4:		[141, 530,   21, 41,  0, 0, 0],
				boot_count_5:		[161, 530,   21, 41,  0, 0, 0],
				boot_you_got_booted:[73, 617,   117, 57,  0, -30, -6],  // big BOOTED
				boot_status_booted:	[102,573,    53, 11,  0, 26, 0],
				act_status_boot:	[102,586,    36, 11,  0, -26, 0],
				
				self_menu_bg:		[88, 314,    82, 76,  0, 0, -31],	// offset relative to larger act_menu
				act_menu_bg:		[3, 314, 	 82,107,  0, 0, 0],
				act_menu_grab:		[26, 531,    35, 7,   0, -23, -7],
				act_menu_scratch:	[15, 540,    59, 7,   0, -12, -16],
				act_menu_tease:		[23, 549, 	 41, 7,   0, -20, -25],
				act_menu_cower:		[22, 562,    44, 7,   0, -19, -38],
				act_menu_lick:	    [10, 571,    68, 15,  0, -7, -47],
				act_menu_tattle:	[10, 592,	 68, 15,  0, -7, -68],
				act_menu_invisible:	[25, 405,     1,  1,  0, -0, 0],
				
				act_status_grab:	[7, 439,     77, 11,  0, -7, 0],
				act_status_scratch: [7, 452,     77, 11,  0, -6, 0],
				act_status_tease:	[7, 467,     77, 11,  0, -6, 0],
				act_status_cower:	[7, 480,     77, 11,  0, -6, 0], 
				act_status_lick:	[7, 494,     77, 11,  0, -6, 0],
				act_status_tattle:	[7, 516,    142, 11,  0, -17, 0],   // TATTLE ON EVERYONE needs computed alignment
				
				
				digit_0:			[129, 18,   22, 27,  0, 0, 0],
				digit_1:			[159, 18,   22, 27,  0, 0, 0],
				digit_2:			[189, 18,   22, 27,  0, 0, 0],
				digit_3:			[219, 18,   22, 27,  0, 0, 0],
				digit_4:			[249, 18,   22, 27,  0, 0, 0],
				digit_5:			[279, 18,   22, 27,  0, 0, 0],
				digit_6:			[309, 18,   22, 27,  0, 0, 0],
				digit_7:			[339, 18,   22, 27,  0, 0, 0],
				digit_8:			[369, 18,   22, 27,  0, 0, 0],
				digit_9:			[399, 18,   22, 27,  0, 0, 0],
				
				// counters for lollies and tattles
				counter_3:			[1, 56,      14, 5,  0, 0, 0],
				counter_2:			[1, 56,       9, 5,  0, 0, 0],
				counter_1:			[1, 56,       4, 5,  0, 0, 0],
				counter_0:			[0, 56,		  1, 1,  0, 0, 0],
				
				// results display
				results_frame:		[  1, 179,  334, 132,    0, 0, 0],
				results_frame_l:	[335, 179,    6, 132,    0, 0, 0],
				results_frame_r:	[342, 179,    6, 132,    0, -327, 0],
				
				show_results_btn:	[668, 13,   51, 31,  0, 0, 0],
				show_results_btn_pressed:	[668, 13,   51, 31,  0, -1, -1],
				
				results_btn_back:	[511, 22,   49, 22,   0, 0, 0],
				results_btn_next:	[564, 22,   46, 22,   0, 0, 0],
				results_btn_done:	[612, 17,   55, 25,   0, 0, 0],
				results_btn_back_pressed:	[511, 22,   49, 22,   0, -1, -1],
				results_btn_next_pressed:	[564, 22,   46, 22,   0, -1, -1],
				results_btn_done_pressed:	[612, 17,   55, 25,   0, -1, -1],
				
				// end of game chalkboard display
				chalkboard:			[430,655,	295,143,	0,	0, 0]
			}
		}
	},
	{	id:		'player_items',	src: 'game/player_items.png',
		data:	{
			pieces: {
				heart_10:			[0, 0,  21, 54,   0,   0, 0],
				heart_9:			[22, 0,  21, 54,   0,   0, 0],
				heart_8:			[44, 0,  21, 54,   0,   0, 0],
				heart_7:			[66, 0,  21, 54,   0,   0, 0],
				heart_6:			[88, 0,  21, 54,   0,   0, 0],
				heart_5:			[110, 0,  21, 54,   0,   0, 0],
				heart_4:			[132, 0,  21, 54,   0,   0, 0],
				heart_3:			[154, 0,  21, 54,   0,   0, 0],
				heart_2:			[176, 0,  21, 54,   0,   0, 0],
				heart_1:			[198, 0,  21, 54,   0,   0, 0],
				heart_0:			[220, 0,  21, 54,   0,   0, 0],
				
				status_undecided:	[12,  56,  12, 18,  0,  0, 0],
				status_decided:		[0, 56,  12, 18,  0,  0, 0],
				
			}
		}
	}
	

		
];


config['colors'] = {
	skin:	{
		base: 1,
		vars: [ 
				[[204,153,102], [153,102,51],  [102,51,0],   [0,0,0]],
				[[255,153,102], [204,102,51],  [153,51,0],   [102,0,0]],
				[[255,206,156], [206,156,99],  [156,99,49],  [99,49,0]],
				[[255,255,153], [204,204,102], [153,153,51], [102,102,0]],
				[[204,204,153], [153,153,102], [102,102,51], [51,51,0]],
				[[207,200,96],  [159,152,48],  [96, 96, 0],  [48,48,0]],
				'grayscale'
			]
	},
	
	hair:	{
		base: 0,
		vars: [
				[[204,204,153], [153,153,102], [102,102,51],  [22,27,0]],	// light brown
				[[255,255,204], [204,204,153], [153,153,102], [51,51,0]],	// blonde
				[[102,102,153], [51,51,102],   [0,0,51],      [0,0,0]],		// dark blue-purple
				[[246,150,121], [237,28,36],   [157,10,14],   [121,0,0]],	// scarlet
				[[204,153,153], [153,102,102], [102,51,51],   [51,0,0]],	// pink-brown
				[[124,197,118], [57,180,74],   [25,122,48],   [0,94,32]],	// bright green
				[[153,204,204], [102,153,153], [51,102,102],  [0,51,51]],	// light blue
				[[240,110,169], [236,0,140],   [158,0,93],    [123,0,70]],	// bright magenta
				'grayscale'
			]
	},
	
	uniforms: {
		base: 0,
		vars: [
				[[156,255,255],  [49,156,156], [0,99,99],  [0,49,49]],
				[[255,206,255], [156,99,156], [99,49,99], [49,0,49]],
				[[206,206,255], [99,99,156],  [49,49,99], [0,0,49]],
				[[156,255,156], [49,156,49],  [0,99,0],   [0,49,0]],
				[[255,255,156], [156,156,49], [99,99,0],  [49,49,0]],
				[[255,206,156], [156,99,49],  [99,49,0],  [49,0,0]],
				'grayscale'
			]	
	}

};

// handy shortcuts for number of options of various parameters 
config.number = {};
config.number.of = {
	face: 			8,
	skincolor: 		6, 	// can't trust config.colors.skin.vars.length now that we have the extra grayscale
	hairstyle: 		13,
	haircolor: 		8, 	// ditto config.colors.hair.vars.length,
	uniform: 		5,
	uniformcolor: 	6,	// ditto config.colors.uniforms.vars.length
	expression:		7,
	pose:			9
}

config.avatar['addonsDims'] = {width:81, height:115, regX:40, regY:9}; // they're all the same size

config.avatar['cryOffset'] = 19; // head items drop down this far in cry pose

config.avatar['numAvatarLayers'] = 10;
config.avatar['overlayLayer'] = 9; // put overlays on topmost layer
config.avatar['numPoses'] = 9;
config.avatar['numExpressions'] = 7;

config.avatar['MAX_ADDONS'] = 3;

config.dressing = {};
config.dressing.uniformNames = ['Skirt+Blouse', 'Sweater', 'Jacket', 'Tracksuit', 'Pants'];
config.dressing.addons = {
	COL_WIDTH: 70, 
	ROW_HEIGHT: 10,
	NUM_COLS: 2,
	TALL_PX: 213, // height in pixels of scroll window
	stripe_color: '#52EC7E',
	hole_color: '#222'
}

config.homeroom = {};
config.homeroom.chalkboard = {
	TALL_PX: 144 // height in pixels of scroll window
};


config.game = {};
config.game.MIN_PLAYERS = 3;  // minimum number of players to start a game
config.game.MAX_PLAYERS = 6;

