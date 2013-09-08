#
# parse Terry's avatar addon asset spreadsheet (Items_DB.csv)
#

import csv
import sys
import json
import re


addons = []

file = sys.stdin
rows = csv.reader(file)

for row in rows:
	#print "// " + str(row)
	if (len(row)==0) :
		continue
		
	try:
		id = int(row[0])
		
		item = {}
		item['id'] = id
		item['tier'] = int(row[1])
		item['name'] = row[2]
		
		# match skin
		if row[3]=='Y':
			item['colorize'] = 1
			item['colorset'] = 'skin'
			
		# reversible
		if row[4]=='Y':
			item['flippable']=1 # apply mirror transform to flip
		elif row[4]=='N/A':
			item['flippable']=2 # don't flip
		else:
			item['flippable']=0 # look for L and R assets
		
		# number of poses
		item['poses'] = int(row[5])
		
		# layers: 
		#    ABC in Layer 3 indicates conflicts in zones A, B, and C in layer 3 and there is art for layer 3 (which would replace any avatar default art on that layer)
		#    (ABC) in layer 3 indicates conflicts but there's no art
		#	 (ABC)! means no art but clear the avatar's default sprite for this layer as if there were art. 
		item['layers'] = [] 
		item['conflicts'] = {}
		override = []
		for layernum in range(0,10): # ten layers 0-9
			column = row[6+layernum]
			# get rid of whitespace
			column = "".join(column.split())
			if len(column) > 0:
				# look for parentheses:
				match = re.match(r"\((\w+)\)(\!*)", column)
				if match:
					# conflicts but no art
					item['conflicts'][layernum] = list(match.group(1))
					if len(match.group(2)) > 0:
						override.append(layernum)
				else:
					# conflicts and art
					item['conflicts'][layernum] = list(column)
					item['layers'].append(layernum)
					
		if len(override) > 0:
			item['override'] = override
	
			
		# infer list of files:
		item['files'] = []
		if len(item['layers']) > 0:
			if item['flippable'] > 0:
				if len(item['layers']) > 1:
					for l in item['layers']:
						#item['files'].append(str(item['id']) + "-" + str(l))
						item['files'].append('%(id)03d-%(layer)d' % {'id':item['id'], 'layer':l})
				else:
					#item['files'].append(str(item['id']))
					item['files'].append('%(id)03d' % {'id':item['id']})
					
			else:
				for f in ['L', 'R']:
					if len(item['layers']) > 1:
						for l in item['layers']:
							#item['files'].append(str(item['id']) + "-" + f + str(l))
							item['files'].append('%(id)03d-%(dir)c%(layer)d' % {'id':item['id'], 'dir':f, 'layer':l})
					else:
						#item['files'].append(str(item['id']) + "-" + f)
						item['files'].append('%(id)03d-%(dir)c' % {'id':item['id'], 'dir':f})
								
		
		# add to list		
		addons.append(item)
			
		
	except ValueError:
		# skip it, it was a row with no id
		pass
		
print "config.addons = " + json.dumps(addons, sort_keys=True, indent=4, separators=(',', ': ')) + ";"
