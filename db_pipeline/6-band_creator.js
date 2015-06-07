// Iterates through every carrier, running the complex Aggregate query
// and creating a Collection of bands

var mongoose = require('mongoose'),
	db = require('../model/db'),
	pages = require('../pages'),
	License = mongoose.model('License'),
	Band = mongoose.model('Band'),
	ProgressBar = require('progress')


console.log("Step 6: Creating cached database of spectrum bands by carrier")


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
		, pops: {$sum: '$pops'}, MHz: {$avg: '$_id.MHz'}, counties: {$addToSet: '$counties'}}},
	{$sort: { '_id.lowerBand':1, pops: -1}}
	], function (err, result) {
		callback(err, result)
	})
}

// get list of carriers
License.distinct("commonName", function(err, carriers) {
	if (err) return console.error(err)
	var carrier_bar = new ProgressBar(':bar', { total: carriers.length })
	var carrier_counter = carriers.length


	// iterate through list of carriers 
	carriers.forEach(function (name) {
		// generate list of frequency bands for carrier
		summaryQuery(name, function(err, result) {
			if (err) return console.error(err)

			var key, counter = 0
			if(name=="PRWireless") console.log(JSON.stringify(result))
	        for(key in result) {
	            if(result.hasOwnProperty(key)) {
	                counter++
	            }
	        }

	        var bar = new ProgressBar(':bar', { total: counter })
	        if(counter == 0) {
	        	// console.log("carrier " + name + "has zero bands")
	        	carrier_bar.tick()
	        	carrier_counter--
	        	if(carrier_bar.complete) {
                    console.log("Done with all carrier")
                    process.exit()
	            }
	        }

			
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

	            // console.log('Saved band for ' + band.carrier + ' at ' + JSON.stringify(band.channelBlock))

				// save to the database       
	            band.save(function (err) {
	                if (err) return console.error(err)
	                bar.tick()
	                if(bar.complete) {
	                    console.log("Done with carrier " + band.carrier + "; remaining: " + --carrier_counter)
	                    carrier_bar.tick()

	                    if(carrier_bar.complete) {
	                        console.log("Done with all carrier")
	                        process.exit()
	                    }
	                } 

	            })
			})
			
		})
	}) 
})

