var mongoose = require('mongoose'),
	db = require('../model/db'),
	pages = require('../pages'),
	License = mongoose.model('License'),
	Bid = mongoose.model('Bid'),
	ProgressBar = require('progress')


var bar

function updateBidParent(bid, lic) {

	bid._license = lic
	// console.log(bid._license.callSign)		

	bid.save(function (err) {
		if (err) return console.error(err)

		Bid.findOne( { 'item.name' : bid.item.name })
		.populate('_license')
		.exec(function (err, bid) {
			if(err) return console.error(err)

			// console.log('The license call sign is %s', bid._license.callSign)
		})

	})
}

// function tries to find one bid to match licenses and connects them
// inputs: license to be updated, and auction-format lot name
// which includes radio code, market code, and channel block letter
function matchBid(lic, search_string) {
	Bid.findOne( { 'item.name' : search_string }, function(err, bid) {
		if(err) return console.error(err)
		if(bid == null) {
			bar.tick()
			return 
		}

		// console.log("Found " + search_string + ' with bidder ' + bid.bidder 
		// 	+ '; location in License: ' + lic.marketDesc 
		// 	+ ' and location in Bid: ' + bid.item.desc)

		// License is now paired with bid
		lic.bid = bid

		lic.save(function (err) {
			if (err) return console.error(err)
			
			// console.log("saved bid, price was " + lic.bid.amount.net)			
			// FIXME supposed to update bid's parent field '_license'. we just leave it empty
			// trying to update it leads to a ValidatorError that i can't fix
			// updateBidParent(bid,lic)
			
			bar.tick()
			if(bar.complete) {
                console.log("Done")
                process.exit() 
            } 
		})
	})
}

console.log("Step 5: Matching auction bids to licenses")

License.find(function(err, licenses) {
	if (err) return console.log(err)

	bar = new ProgressBar(':bar', { total: licenses.length })

	for (var i=0; i<licenses.length; ++i) {
		var lic = licenses[i]

		var search_string = lic.radioServiceCode + "-" 
			+ lic.marketCode + "-" + lic.channel

		matchBid(lic, search_string)

	}

})

