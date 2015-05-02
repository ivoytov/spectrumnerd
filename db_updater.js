var mongoose = require( 'mongoose' );

var bl = require('bl'),
    fs = require('fs'),
    db = require('./model/db')

License = mongoose.model('License')

// read JSON file
fs.readFile('output.json', 'utf8', function doneReading (err, data) { 
    if(err)
        console.error(err)
    
    var preprocessDb = JSON.parse(data)
        
    preprocessDb.Licenses.License.forEach( function(src) {

        // find existing license with id
        License.find( { id: src["\$"].id }, function(err, lic) {
            if (err) return console.error(err)

            lic[0].radioServiceDesc = src.radioServiceDesc
            if(src.ChannelBlock[0]["\$"]) {
                lic[0].channel = src.ChannelBlock[0]["\$"].channel.trim()
            }

            console.log("updating license " + lic[0].callSign + " with radio code " + lic[0].radioServiceDesc 
                + " and channel " + lic[0].channel)


            lic[0].save(function (err) {
                if (err) return console.error(err)
            })
        })

    })       
})






