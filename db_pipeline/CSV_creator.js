// Generates 2 CSV files:
// 1. carrier bands - listing all carriers and bands in possession
// 2. counties - listing all counties and all carriers with bands in each county


var mongoose = require('mongoose'),
	db = require('../model/db'),
	pages = require('../pages'),
	License = mongoose.model('License'),
	ProgressBar = require('progress'),
	stringify = require('csv-stringify'),
	fs = require('fs'),
	bl = require('bl')

// iterates over the frequency channels (up to 4) and inserts columns
function iterBlocks(cb) {
    var formatted = ""
    
    for(var i=0; i<cb.length; ++i) {
        formatted += cb[i].lowerBand + '-' + cb[i].upperBand
        if(i<cb.length-1) formatted += ', '
    }
    return formatted
}

console.log("Step 7: Creating CSV outputs")

var bandList = [[ 'Carrier', 'Band', 'MHz', 'Pops Covered', 'Price Paid', '$ per MHz POP']],
	ctyList = [[ 'FIPS', 'Cty Name', 'State', 'Population', 'Carrier', 'Band', 'MHz' ]]

// read in county list from FIPS.json so we can look up county names
fs.readFile('../html/FIPS.json', 'utf8', function doneReading (err, data) { 
    if(err) console.error(err)
    
    var counties = JSON.parse(data)


	// get list of carriers
	getCarriers(function(err, carriers) {
		if (err) return console.error(err)
		var carrier_bar = new ProgressBar(':bar', { total: carriers.length })


		// iterate through list of carriers 
		carriers.forEach(function (name) {
			// generate list of frequency bands for carrier
			getBands(name, function(err, result) {
				if(err) return console.error(err)

				for(var i=0; i<result.length; ++i) {
					var MHzPOP = result[i].price / (result[i].MHz * result[i].population)
					var cb = iterBlocks(result[i].channelBlock)
					bandList.push([ name
						, cb
						, result[i].MHz
						, result[i].population
						, result[i].price
						, MHzPOP ])

					for(var j=0; j<result[i].counties.length; ++j) {
						var FIPS = result[i].counties[j]
						ctyList.push([ FIPS
							, counties[FIPS].name.cname
							, counties[FIPS].name.state
							, counties[FIPS].population
							, name
							, cb
							, result[i].MHz ])

					}
				}
				
				carrier_bar.tick()

				if(carrier_bar.complete) {
					console.log("Done with all carriers, writing file")

					stringify(bandList, function(err, CSVoutput) {
						if(err) return console.error(err)

						fs.writeFile('../html/bands.csv', CSVoutput, function(err) {
							if(err) return console.error(err)


							// process.exit()
						})

					})

					stringify(ctyList, function(err, CSVoutput) {
						if(err) return console.error(err)

						fs.writeFile('../html/counties.csv', CSVoutput, function(err) {
							if(err) return console.error(err)


							// process.exit()
						})

					})				
				}
			})

		}) 
	})
})		

