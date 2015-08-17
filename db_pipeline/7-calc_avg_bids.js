// Iterates through every carrier, running the complex Aggregate query
// and creating a Collection of bands

var mongoose = require('mongoose'),
	db = require('../model/db'),
	pages = require('../pages'),
	License = mongoose.model('License'),
	Bid = mongoose.model('Bid'),
	ProgressBar = require('progress'),
	stringify = require('csv-stringify'),
	fs = require('fs'),
	bl = require('bl')


console.log("Step 7: Calculating average bids by auction")

// returns total amount spent and population covered for each auction by channel
function auctionStats(callback) {
	License.aggregate([
	{$match: { 'bid.auction.id': { $gt:  0}}},
	{$project: { _id:0, 'bid.auction.id':1, channel:1, MHz:1, 
		'channelBlock.lowerBand':1, 'channelBlock.upperBand':1, 
		'bid.amount.gross': 1, population:1}},
	{$group: { _id: {auction: '$bid.auction.id', channel: '$channel', MHz: '$MHz',
		start: '$channelBlock.lowerBand', end: '$channelBlock.upperBand'}, 
		totalPrice: {$sum: '$bid.amount.gross'}, 
		totalPops: {$sum: '$population'} }},
	{$sort: { _id: 1}}
	], function (err, result) {
		callback(err, result)
	})
}

// get price, MHz and pops stats for all auctions in DB
auctionStats(function (err, result) {
	if (err) return console.error(err)

	var cols = [[ 'Auction ID', 'Channel', 'MHz', 'Frequency', 'Pops Covered', 'Price Paid', '$ per MHz POP']]
	for(var i=0; i<result.length; ++i) {
		var MHzPOP = result[i].totalPrice / (result[i].totalPops * result[i]._id.MHz)
		cols.push([ result[i]._id.auction
			, result[i]._id.channel
			, result[i]._id.MHz
			, result[i]._id.start
			, result[i].totalPops
			, result[i].totalPrice
			, MHzPOP ])
	}

	stringify(cols, function(err, CSVoutput) {
		if(err) return console.error(err)

		fs.writeFile('../html/auctions.csv', CSVoutput, function(err) {
			if(err) return console.error(err)

			process.exit()
		})

	})
})



