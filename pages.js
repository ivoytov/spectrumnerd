var mongoose = require('mongoose'),
	License = mongoose.model('License'),
	Bid = mongoose.model('Bid'),
	County = mongoose.model('County'),
	Band = mongoose.model('Band'),
	url = require('url')



// list all unique carriers. no inputs required. 
// returns an array of unique carrier names, sorted by population covered
getCarriers = function(callback) {
	Band.aggregate([
	{$group: { _id: '$carrier', maxpopulation: {$max: '$population'}}},
	{$sort: {maxpopulation:-1}},
	{$project: {_id: 1}}
	], function(err, result) {
		var sortedcarriers = []
		for (var key in result) {
			sortedcarriers.push(result[key]._id)
		}
		callback(err, sortedcarriers)
	})

	// Primitive way of doing this - not sorted in any way
	// License.distinct("commonName", function(err, carriers) {
	// 	callback(err, carriers)
	// })
}

// list all unique auctions. returns an array of auction id and auction desc
function getAuctions(callback) {
	Bid.distinct('auction', function (err, auctions) {
		callback(err, auctions)
	})
}

function calcMHz(channelBlock) {
	var val = 0;
	for(var i=0;i<channelBlock.length;++i) {
		val += channelBlock[i].upperBand - channelBlock[i].lowerBand
	}
	return val
}

// returns all licenses matching query submitted via the api. 
function licenseQuery(api, callback) {
	var query = License.find( {} )

	// add "commonName=Verizon" to only see Verizon licenses
	if(api.commonName)
		query.where('commonName').equals(api.commonName)

	// remove the county list since it gets huge
	query.select('-counties -_id')

	// add "frequencyFrom=345" to only see lots with at least one lowerBand above 345
	if(api.frequencyFrom) 
		query.where('channelBlock.lowerBand').gt(parseInt(api.frequencyFrom, 10))

	// add "frequencyTo=345" to only see lots with at least one upperBound frequency below 345
	if(api.frequencyTo)
		query.where('channelBlock.upperBand').lt(parseInt(api.frequencyTo, 10))

	if(api.channelBlock) {
		var json = JSON.parse(decodeURIComponent(api.channelBlock))
		// FIXME current iteration identifies all licenses with matching lower downlink. 
		// no comparison is done for other items in channelBlock (just the first one)
		console.log(JSON.stringify(json))

		// query.where('MHz').equals(calcMHz(json))
		query.where('channelBlock.lowerBand').equals(json[0].lowerBand)
		query.where('channelBlock.upperBand').equals(json[0].upperBand)
	}
			
	// add "showBids=1" to only see lots with auction data
	if(api.showBids)
		query.where('bid').exists()

	// only return selected auction
	if(api.auction)
		query.where('bid.auction.id').equals(parseInt(api.auction))

	// sort by pops
	query.sort('-population')

	// get data
	query.exec(function (err, lic) {
		console.log(api.commonName)
		callback(err, lic)
		
	})

}

// helper function that takes a type of Market Code
function countyFinder(marketCode, callback) {
	console.log("looking for counties in " + marketCode)
	County.find(marketCode, function (err, cty) {
		callback(err, cty)
	})
} 


// Takes a carrier name and returns the frequency bands controlled by them
getBands = function(name, callback) {
	Band.find({carrier: name}).sort('channelBlock.lowerBand').exec(function (err, bands) {
		callback(err, bands)
	})
} 


// find all counties making up a market code, requires a market code
// FIXME replace this case switch with polymorphic code
function marketCode(marketCode, callback) {

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

	res.type('application/json')

	if(qry.pathname === '/api/getCarriers') {
		getCarriers(function(err, result) {
			if(err) return console.error(err)
			res.send(JSON.stringify(result))
		})
	} else if(qry.pathname === '/api/marketCodes') {
		marketCode(qry.query.marketCode, function(err, result) {
			if(err) return console.error(err)
			res.send(JSON.stringify(result))
		})
	} else if(qry.pathname === '/api/getAuctions') {
		getAuctions(function(err, result) {
			if(err) return console.error(err)
			res.send(JSON.stringify(result))
		})
	} else if(qry.pathname === '/api/getBands') {
		getBands(qry.query.commonName, function(err, result) {
			if (err) return console.error(err)
			res.send(JSON.stringify(result))
		})
	} else {
		licenseQuery(qry.query, function(err, result) {
			if (err) return console.error(err)
			res.send(JSON.stringify(result))
		})
	}
}
