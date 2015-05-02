var mongoose = require('mongoose'),
	License = mongoose.model('License'),
	County = mongoose.model('County'),
	url = require('url')

// close connection
function closeConnection(res, output) {
	res.write(output)
	res.end()
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

// returns all licenses owned by a carrier. Requires a commonName input
// FIXME: enable this to work for licenses without a commonName
function carrier(res, commonName) {
	License.find({ commonName: commonName}, function(err, lic) {

		console.log(commonName)
		var jsonOutput

		if (err) {
			console.log(err)
		} else {
			jsonOutput = JSON.stringify(lic)
		}
		closeConnection(res, jsonOutput)
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
    console.log(marketCode)

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

	res.setHeader('Access-Control-Allow-Origin', '*')
	res.writeHead(200, { 'Content-Type': 'application/json' })

	if(qry.pathname === '/api/getCarriers') {
		getCarriers(res)
	} else if(qry.pathname === '/api/marketCodes') {
		marketCode(res, qry.query.marketCode)
	} else {
		console.log("about to call carrier() on " + qry.query.commonName)
		carrier(res, qry.query.commonName)
	}
}
