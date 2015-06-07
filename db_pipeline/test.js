db.licenses.aggregate([
	{$match: {commonName: "Verizon Wireless", 'channelBlock.lowerBand':746 }},
	{$project: { _id:0, 'channelBlock.lowerBand':1, 'channelBlock.upperBand':1
		, counties:1, MHz:1, 'bid.amount.net':1}},
	{$unwind: '$counties'},
	{$group: {_id: '$channelBlock'
		, MHz: {$avg: '$MHz'}
		, price: {$sum: '$bid.amount.net'}
		, allcounties: {$addToSet: '$counties'}
		, pops: {$sum: '$counties.population'}}},
	{$sort: { '_id.lowerBand':1, pops: -1}}
	])

db.licenses.aggregate([
	{$match: { commonName: "Verizon Wireless", 'channelBlock.lowerBand':746 }},
	{$project: { _id:0, 'channelBlock.lowerBand':1, 'channelBlock.upperBand':1
		, counties:1, MHz:1, 'bid.amount.net':1}},
	{$unwind: '$counties'},
	{$group: {_id: { cb: '$channelBlock', bid: '$bid.amount.net'
		, MHz: '$MHz', allcounties: '$counties'}}},
	{$group: {_id: { cb: '$_id.cb', price: '$_id.bid'
		, MHz: '$_id.MHz'}, pops: {$sum: '$_id.allcounties.population'}
		, counties: {$addToSet: '$_id.allcounties.id'}}},
	{$group: {_id: '$_id.cb', price: {$sum: '$_id.price'}
		, pops: {$sum: '$pops'}, MHz: {$avg: '$_id.MHz'}, counties: {$addToSet: '$counties'}}},
	{$sort: { '_id.lowerBand':1, pops: -1}}
	])


db.licenses.find({ commonName: "Verizon"
	, MHz: 22
	, 'channelBlock.lowerBand': 746
	, 'channelBlock.upperBand': 757 }
	, { _id:0, commonName:1, population: 1, callSign:1})

db.licenses.aggregate([

	])


db.counties.aggregate([
	{$match: { $or: [
		{ id: 6029}
		, {id:6067}
		, {id:56029}
		, {id:6063}
		, {id:49027}
		, {id:41011}
		, {id:53031}
		, {id:30047}
		, {id:53047}
		, {id:30065}
		, {id:6091}
		, {id:6069}
		, {id:30049}
		, {id:6093}
		, {id:6043}
		, {id:6061}
		, {id:30001}
		, {id:30021}
		, {id:41001}
		, {id:30075}
		, {id:49055}
		, {id:6025}
		, {id:41017}
		, {id:6039}
	]}},
	{$group: { _id: '$name.state', population: {$sum: '$population'}}}
])

6109, 32510, 6055, 41015, 6105, 6079, 16043, 6111, 41039, 6053, 16003, 41023, 6045, 53039, 6081, 53065, 6011, 6019, 53015, 16023, 41049, 53053, 30105, 16033, 30095, 49011, 16069, 49047, 16055, 16059, 16005, 41059, 30093, 53059, 32011, 16017, 53057, 16083, 49003, 30037, 32013, 30015, 49029, 30007, 32019, 30055, 6089, 49041, 30081, 16065, 4012, 30031, 30023, 49015, 16039, 49049, 30027, 56033, 16085, 41037, 16001, 16037, 53013, 6027, 41065, 30071, 30033, 6083, 41025, 30107, 53033, 6037, 16061, 49001, 49053, 53017, 41005, 41019, 41057, 49007, 53055, 49031, 16081, 30039, 41045, 49021, 49043, 41021, 49045, 53061, 6099, 30097, 53003, 53021, 32009, 53051, 41047, 6049, 16073, 16013, 16079, 41041, 56039, 6031, 53043, 6035, 53077, 30085, 30019, 30009, 53011, 53049, 53009, 30079, 16057, 32029, 41071, 30025, 30051, 6057, 53001, 49023, 41007, 6071, 16075, 53019, 41051, 16025, 16011, 41035, 30061, 6095, 6077, 16009, 56003, 53027, 16067, 30099, 53075, 6021, 16019, 6115, 41027, 41063, 6023, 16051, 32003, 30067, 30089, 32023, 30003, 49019, 6087, 16047, 53005, 32001, 30101, 6085, 49051, 30035, 41033, 56019, 32021, 41009, 6075, 32033, 53035, 30103, 6017, 30005, 16035, 30043, 49035, 53063, 6107, 6113, 49005, 30087, 30045, 4027, 41061, 41013, 30091, 6007, 16021, 53071, 41055, 6103, 6013, 30063, 32017, 16063, 16027, 32007, 16053, 16041, 16045, 6001, 30013, 30083, 53023, 6059, 16071, 53073, 6101, 6009, 32005, 53029, 49039, 30111, 30073, 49013, 41031, 41067, 6003, 16087, 53069, 30029, 16049, 6041, 30041, 41053, 30077, 32031, 53067, 30057, 6047, 30069, 6051, 49057, 53025, 41029, 4015, 32027, 30113, 16077, 6005, 41003, 53037, 41069, 6073, 16015, 41043, 16031, 6065, 30053, 6097, 6015, 30017, 53041, 53045, 49017, 6033, 30059, 32015, 53007 ]}}


