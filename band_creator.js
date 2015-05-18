// Iterates through every carrier, running the complex Aggregate query
// and creating a Collection of bands

var mongoose = require('mongoose'),
	db = require('./model/db'),
	pages = require('./pages'),
	License = mongoose.model('License'),
	Band = mongoose.model('Band')

// returns summary statistics on licenses matching a query
function summaryQuery(name, callback) {
	License.aggregate([
	{$match: { commonName: name}},
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
		, pops: {$sum: '$pops'}, MHz: {$avg: '$_id.MHz'}, counties: {$first: '$counties'}}},
	{$sort: { '_id.lowerBand':1, pops: -1}}
	], function (err, result) {
		callback(err, result)
	})
}

// get list of carriers
License.distinct("commonName", function(err, carriers) {
	if (err) return console.error(err)

	// iterate through list of carriers 
	carriers.forEach(function (name) {
		// generate list of frequency bands for carrier
		summaryQuery(name, function(err, result) {
			if (err) return console.error(err)
			
			// iterate through each band, saving it to the database
			result.forEach(function (item) {
				// create a new band table row
				var band = new Band({
					carrier: item.carrier,
					channelBlock: item._id,
					price: item.price,
					population: item.pops,
					MHz: item.MHz,
					counties: item.counties
				})

	            console.log('Saved band for ' + band.carrier + ' at ' + JSON.stringify(band.channelBlock))

				// save to the database       
	            band.save(function (err) {
	                if (err) return console.error(err)

	            })
			})
			
		})
	}) 
})

