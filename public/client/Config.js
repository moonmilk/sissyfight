config = {};

config['avatar'] = {};
var xoffset = 40;

config['assetPath'] = '../client/assets/';

config['preloadManifest'] = [
	{
		id: 	'preload_bg',
		src:	'placeholder/loading_placeholder.png'
	}
]

config['manifest'] = [
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
	
	
	
	{ 	id: 	'dressing_behind', 	src: 'dressing/dressing_behind.png' },
	{ 	id: 	'dressing_frame', 	src: 'dressing/dressing_frame.png' },
	{
	 	id: 	'dressing_items', 	src: 'dressing/dressing_items.png',
	 	data: {
	 		pieces: {
	 			dressing_btn_ok_active: 	[39,2,  36,23,  0, 0,0], 
	 			dressing_btn_ok_disabled:	[39,29, 36,23,  0, 0,0], 
	 			dressing_ptr_skincolor: 	[79,2,  40,45,  0, 9,12], 
	 			dressing_ptr_haircolor:		[122,2, 26,26,  0, 0,0], 
	 			dressing_ptr_addon:			[0, 54, 75,22,  0, 0,0], 
	 			dressing_ptr_addon_disabled:[75,54, 75,22,  0, 0,0], 
	 			dressing_lever: 			[21, 1, 16,47,  0, 0,0], 
	 			dressing_lever_pulled:		[0,  1, 19,47,  0, 1,0]  
	 		}
	 	}
	 },
	
	
	{
		id:		'bg-angel',
		src:	'background/angel.png'
	},
	
		
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
				[[207,200,96],  [159,152,48],  [96, 96, 0],  [48,48,0]]
			]
	},
	
	hair:	{
		base: 0,
		vars: [
				[[204,204,153], [153,153,102], [102,102,51],  [22,27,0]],
				[[255,255,204], [204,204,153], [153,153,102], [51,51,0]],
				[[153,204,204], [102,153,153], [51,102,102],  [0,51,51]],
				[[102,102,153], [51,51,102],   [0,0,51],      [0,0,0]],
				[[204,153,153], [153,102,102], [102,51,51],   [51,0,0]],
				[[124,197,118], [57,180,74],   [25,122,48],   [0,94,32]],
				[[240,110,169], [236,0,140],   [158,0,93],    [123,0,70]],
				[[246,150,121], [237,28,36],   [157,10,14],   [121,0,0]]
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
				[[255,206,156], [156,99,49],  [99,49,0],  [49,0,0]]
			]	
	}

};

// handy shortcuts for number of options of various parameters 
config.number = {};
config.number.of = {
	faces: 			8,
	skincolors: 	config.colors.skin.vars.length,
	hairstyles: 	13,
	haircolors: 	config.colors.hair.vars.length,
	uniforms: 		5,
	uniformcolors: config.colors.uniforms.vars.length
}

config.avatar['addonsDims'] = {width:81, height:115, regX:40, regY:9}; // they're all the same size

config.avatar['cryOffset'] = 19; // head items drop down this far in cry pose

config.avatar['numAvatarLayers'] = 10;
config.avatar['numPoses'] = 9;
config.avatar['numExpressions'] = 7;


