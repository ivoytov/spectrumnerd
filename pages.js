var mongoose = require('mongoose'),
	License = mongoose.model('License'),
	Bid = mongoose.model('Bid'),
	County = mongoose.model('County'),
	url = require('url')

// close connection
function closeConnection(res, output) {
	res.send(output)
}


// list all unique carriers. no inputs required. returns an array of unique carrier names
function getCarriers(res) {
	var jsonOutput = ""
	License.distinct("commonName", function(err, carriers) {
		if (err) console.error(err)

		jsonOutput = JSON.stringify(carriers)
		closeConnection(res, jsonOutput)
	})
}

// list all unique auctions. returns an array of auction id and auction desc
function getAuctions(res) {
	var jsonOutput = ""
	Bid.distinct('auction', function (err, auctions) {
		if (err) return console.error(err)

		jsonOutput = JSON.stringify(auctions)
		closeConnection(res, jsonOutput)
	})
}

// returns all licenses matching query submitted via the api. 
function licenseQuery(res, api) {
	var query = License.find( {} )
	// .populate('bid')
	.sort('-population')
	.limit(150)

	// add "commonName=Verizon" to only see Verizon licenses
	if(api.commonName)
		query.where('commonName').equals(api.commonName)

	// add "frequencyFrom=345" to only see lots with at least one lowerBand above 345
	if(api.frequencyFrom) 
		query.where('channelBlock.lowerBand').gt(parseInt(api.frequencyFrom, 10))

	// add "frequencyTo=345" to only see lots with at least one upperBound frequency below 345
	if(api.frequencyTo)
		query.where('channelBlock.upperBand').lt(parseInt(api.frequencyTo, 10))

	// add "showBids=1" to only see lots with auction data
	if(api.showBids)
		query.where('bid').exists()

	// only return selected auction
	if(api.auction)
		query.where('bid.auction.id').equals(parseInt(api.auction))

	// remove county list since it gets huge
	query.select('-counties')

	// get data
	query.exec(function (err, lic) {

		console.log(api.commonName + ' and freq ' + api.frequencyFrom
			+ '-' + api.frequencyTo + ' and auction ' + api.auction)
		var jsonOutput

		if (err) return console.error(err)
		
		jsonOutput = JSON.stringify(lic)
		
		closeConnection(res, jsonOutput)
	})

}

// returns summary statistics on licenses matching a query

function summaryQuery(res, api) {
	License.aggregate([



	{$match: { commonName: api.commonName}},
	// eliminate unneeded fields. Specifically the freqId since it makes CBs look different when the same
	{$project: { commonName:1, 'channelBlock.lowerBand':1, 'channelBlock.upperBand':1
		, counties:1, MHz:1, bid:1}},
	// FIXME: see if you can replace the $unwind and $addToSet with a $group
	{$unwind: '$counties'},
	{$group: {_id: { carrier: '$commonName', cb: '$channelBlock', bid: '$bid.amount.net'
		, MHz: '$MHz', allcounties: '$counties'}}},
	{$group: {_id: {cb: '$_id.cb', price: '$_id.bid', MHz: '$_id.MHz'}, pops: {$sum: '$_id.allcounties.population'}}},
	{$group: {_id: '$_id.cb', price: {$sum: '$_id.price'}, pops: {$sum: '$pops'}, MHz: {$avg: '$_id.MHz'}}},
	{$match: { '_id.lowerBand': {$gte: parseInt(api.frequencyFrom,10)}, 
		'_id.upperBand': {$lte: parseInt(api.frequencyTo,10)}}},
	{$sort: { '_id.lowerBand':1, pops: -1}}
	], function (err, result) {
		if (err) return console.error(err)

		closeConnection(res, JSON.stringify(result)	)
	})
}



// helper function that takes a type of Market Code and 'res'
// outputs the list of counties and closes the connection
function countyFinder(marketCode, res) {
	County.find(marketCode, function (err, cty) {
		if(err) console.error(err)
		closeConnection(res, JSON.stringify(cty))
	})
} 

// find all counties making up a market code, requires a market code
// FIXME replace this case switch with polymorphic code
function marketCode(res, marketCode) {
	County.byMarket(marketCode, function (err, counties) {
		// early exit if error
		if (err) console.error(err)

		closeConnection(res, counties)
	})
}

// find all counties making up a market code, requires a market code
// FIXME replace this case switch with polymorphic code
function marketCode(res, marketCode) {
    var jsonOutput

    var letters = marketCode.substring(0,3)
    var numbers = Number(marketCode.substring(3))

    switch(letters) {
        case "CMA":
            countyFinder({ cma: numbers }, res)
        	break
        case "BTA":
            countyFinder({ bta : numbers }, res)
            break
        case "MTA":
            countyFinder({ mta : numbers }, res)
            break
        case "RPC":
            countyFinder({ rpc : numbers }, res)
            break
        case "BEA":
            countyFinder({ bea : numbers }, res)
            break
        case "MEA":
            countyFinder({ mea : numbers }, res)
            break
        case "REA":
            countyFinder({ rea : numbers }, res)
            break
        case "EAG":
            countyFinder({ eag : numbers }, res)
            break
        case "VPC":
            countyFinder({ vpc : numbers }, res)
            break
        case "PSR":
            countyFinder({ psr : numbers }, res)
            break
    }

}

exports.index = function (req, res) {
	var qry = url.parse(req.url, true)

	// res.setHeader('Access-Control-Allow-Origin', '*')
	res.type('application/json')

	if(qry.pathname === '/api/getCarriers') {
		getCarriers(res)
	} else if(qry.pathname === '/api/marketCodes') {
		marketCode(res, qry.query.marketCode)
	} else if(qry.pathname === '/api/getAuctions') {
		getAuctions(res)
	} else if(qry.pathname === '/api/summarize') {
		summaryQuery(res, qry.query)
	} else {
		licenseQuery(res, qry.query)
	}
}
