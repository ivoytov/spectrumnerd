var mongoose = require('mongoose'),
	db = require('./model/db'),
	pages = require('./pages'),
	License = mongoose.model('License'),
	County = mongoose.model('County')

License.find(function(err, licenses) {
	if (err) return console.log(err)

	for (var i=0; i<licenses.length; ++i) {
		var lic = licenses[i],
			MHz = 0

		for (var j=0; j<lic.channelBlock.length; ++j) {
			var cb = lic.channelBlock[j]
			// MHz += (cb.upperBand - cb.lowerBand)
			cb.lowerBand = parseInt(cb.lowerBand, 10)
			cb.upperBand = parseInt(cb.upperBand, 10)
		}
		
		console.log('license with call sign ' + lic.callSign + ' controls ' + MHz + ' MHz')
		// lic.MHz = MHz

		lic.markModified('channelBlock')
		lic.save(function (err) {
			if (err) console.error(err)
		})


	}

})

