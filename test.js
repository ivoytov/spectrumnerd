	db.licenses.aggregate([
	{$match: { commonName: 'Ntelos'}},
	// eliminate unneeded fields. Specifically the freqId since it makes CBs look different when the same
	{$project: { commonName:1, 'channelBlock.lowerBand':1, 'channelBlock.upperBand':1
		, counties:1, MHz:1, bid:1}},
	// create a list of counties covered by licenses
	{$unwind: '$counties'},
	// {$group: {_id: { carrier: '$commonName', cb: '$channelBlock', bid: '$bid.amount.net'
	// 	, MHz: '$MHz', allcounties: '$counties'}}},
	{$group: {_id: { carrier: '$commonName', cb: '$channelBlock', price: '$bid.amount.net'
		, MHz: '$MHz'},
		, counties: {$addToSet: '$counties'}}}
	// group licenses into channel block
	// {$group: {_id: '$_id.cb', carrier: {$first: '$_id.carrier'}, price: {$sum: '$_id.price'}, pops: {$sum: '$pops'}, MHz: {$avg: '$_id.MHz'}}},
	// {$sort: { '_id.lowerBand':1, pops: -1}}
	])


	db.licenses.aggregate([
	{$match: { commonName: 'Ntelos'}},
	// eliminate unneeded fields. Specifically the freqId since it makes CBs look different when the same
	{$project: { commonName:1, 'channelBlock.lowerBand':1, 'channelBlock.upperBand':1
		, counties:1, MHz:1, bid:1}},
	{$unwind: '$counties'},
	{$group: {_id: { carrier: '$commonName', cb: '$channelBlock', bid: '$bid.amount.net'
		, MHz: '$MHz', allcounties: '$counties'}}},
	{$group: {_id: { carrier: '$_id.carrier', cb: '$_id.cb', price: '$_id.bid'
		, MHz: '$_id.MHz'}, pops: {$sum: '$_id.allcounties.population'}
		, counties: {$addToSet: '$_id.allcounties.id'}}},
	{$group: {_id: '$_id.cb', carrier: {$first: '$_id.carrier'}, price: {$sum: '$_id.price'}
		, pops: {$sum: '$pops'}, MHz: {$avg: '$_id.MHz'}, counties:'$counties'}},
	{$sort: { '_id.lowerBand':1, pops: -1}}
	])