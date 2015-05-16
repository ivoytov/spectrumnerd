var mongoose = require('mongoose'),
	License = mongoose.model('License'),
	Bid = mongoose.model('Bid'),
	County = mongoose.model('County'),
	url = require('url')



// list all unique carriers. no inputs required. returns an array of unique carrier names
function getCarriers(callback) {
	License.distinct("commonName", function(err, carriers) {
		callback(err, JSON.stringify(carriers))
	})
}

// list all unique auctions. returns an array of auction id and auction desc
function getAuctions(callback) {
	Bid.distinct('auction', function (err, auctions) {

		callback(err, JSON.stringify(auctions))
	})
}

// returns all licenses matching query submitted via the api. 
function licenseQuery(api, callback) {
	var query = License.find( {} )
	.sort('-population')

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
		
		callback(err, JSON.stringify(lic))
		
	})

}

// returns summary statistics on licenses matching a query

function summaryQuery(api, callback) {
	License.aggregate([
	{$match: { commonName: api.commonName}},
	// eliminate unneeded fields. Specifically the freqId since it makes CBs look different when the same
	{$project: { commonName:1, 'channelBlock.lowerBand':1, 'channelBlock.upperBand':1
		, counties:1, MHz:1, bid:1}},
	{$unwind: '$counties'},
	{$group: {_id: { carrier: '$commonName', cb: '$channelBlock', bid: '$bid.amount.net'
		, MHz: '$MHz', allcounties: '$counties'}}},
	{$group: {_id: {cb: '$_id.cb', price: '$_id.bid', MHz: '$_id.MHz'}, pops: {$sum: '$_id.allcounties.population'}}},
	{$group: {_id: '$_id.cb', price: {$sum: '$_id.price'}, pops: {$sum: '$pops'}, MHz: {$avg: '$_id.MHz'}}},
	{$sort: { '_id.lowerBand':1, pops: -1}}
	], function (err, result) {
		callback(err, JSON.stringify(result))
	})
}



// helper function that takes a type of Market Code and 'res'
// outputs the list of counties and closes the connection
function countyFinder(marketCode, callback) {
	console.log("looking for counties in " + marketCode)
	County.find(marketCode, function (err, cty) {
		callback(err, JSON.stringify(cty))
	})
} 


// find all counties making up a market code, requires a market code
// FIXME replace this case switch with polymorphic code
function marketCode(marketCode, callback) {
    var jsonOutput

    var letters = marketCode.substring(0,3)
    var numbers = Number(marketCode.substring(3))

    switch(letters) {
        case "CMA":
            countyFinder({ cma: numbers }, callback)
        	break
        case "BTA":
            countyFinder({ bta : numbers }, callback)
            break
        case "MTA":
            countyFinder({ mta : numbers }, callback)
            break
        case "RPC":
            countyFinder({ rpc : numbers }, callback)
            break
        case "BEA":
            countyFinder({ bea : numbers }, callback)
            break
        case "MEA":
            countyFinder({ mea : numbers }, callback)
            break
        case "REA":
            countyFinder({ rea : numbers }, callback)
            break
        case "EAG":
            countyFinder({ eag : numbers }, callback)
            break
        case "VPC":
            countyFinder({ vpc : numbers }, callback)
            break
        case "PSR":
            countyFinder({ psr : numbers }, callback)
            break
    }

}

exports.index = function (req, res) {
	var qry = url.parse(req.url, true)

	// res.setHeader('Access-Control-Allow-Origin', '*')
	res.type('application/json')

	if(qry.pathname === '/api/getCarriers') {
		getCarriers(function(err, result) {
			if(err) return console.error(err)
			res.send(result)
		})
	} else if(qry.pathname === '/api/marketCodes') {
		marketCode(qry.query.marketCode, function(err, result) {
			if(err) return console.error(err)
			res.send(result)
		})
	} else if(qry.pathname === '/api/getAuctions') {
		getAuctions(function(err, result) {
			if(err) return console.error(err)
			res.send(result)
		})
	} else if(qry.pathname === '/api/summarize') {
		summaryQuery(qry.query, function(err, result) {
			if (err) return console.error(err)
			res.send(result)
		})
	} else {
		licenseQuery(qry.query, function(err, result) {
			if (err) return console.error(err)
			res.send(result)
		})
	}
}
