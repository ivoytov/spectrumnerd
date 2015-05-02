var mongoose = require('mongoose'),
	db = require('./model/db'),
	pages = require('./pages'),
	License = mongoose.model('License'),
	County = mongoose.model('County')

// helper function, formats #,##0.0 numbers
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// helper function that takes a type of Market Code and 'lic'
// outputs the list of counties and closes the connection
function countyPopBldr(marketCode, lic) {
	County.find(marketCode, function (err, counties) {
		if(err) console.error(err)

		var population = 0
		
		for (var i=0; i<counties.length; ++i) {
			var cty = counties[i]

			population += cty.population
			lic.counties.push(cty)
		}
		lic.population = population
		console.log("License "+lic.callSign + " with market code " + lic.marketCode 
			+ " has population of " + numberWithCommas(population))

		lic.save(function (err) {
			if (err) console.error(err)
		})
	})
} 

License.find(function(err, licenses) {
	if (err) return console.log(err)

	for (var i=0; i<licenses.length; ++i) {
		var lic = licenses[i]

		if (lic.marketCode === undefined) continue
		
		var marketCode = lic.marketCode
		
		var jsonOutput
	    console.log(marketCode)

	    var letters = marketCode.substring(0,3)
	    var numbers = Number(marketCode.substring(3))

	    switch(letters) {
	        case "CMA":
	            countyPopBldr({ cma: numbers }, lic)
	        	break
	        case "BTA":
	            countyPopBldr({ bta : numbers }, lic)
	            break
	        case "MTA":
	            countyPopBldr({ mta : numbers }, lic)
	            break
	        case "RPC":
	            countyPopBldr({ rpc : numbers }, lic)
	            break
	        case "BEA":
	            countyPopBldr({ bea : numbers }, lic)
	            break
	        case "MEA":
	            countyPopBldr({ mea : numbers }, lic)
	            break
	        case "REA":
	            countyPopBldr({ rea : numbers }, lic)
	            break
	        case "EAG":
	            countyPopBldr({ eag : numbers }, lic)
	            break
	        case "VPC":
	            countyPopBldr({ vpc : numbers }, lic)
	            break
	        case "PSR":
	            countyPopBldr({ psr : numbers }, lic)
	            break
	    }

	}

})

