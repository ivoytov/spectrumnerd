var mongoose = require( 'mongoose' );

var bl = require('bl'),
    fs = require('fs'),
    db = require('../model/db'),
    ProgressBar = require('progress')

License = mongoose.model('License')

console.log("Step 1: Reading license info from the FCC")

// read JSON file
fs.readFile('../Source Spreadsheets/output.json', 'utf8', function doneReading (err, data) { 
    if(err)
        console.error(err)
    
    var preprocessDb = JSON.parse(data)
    var key, counter = 0;
    for(key in preprocessDb.Licenses.License) {
        if(preprocessDb.Licenses.License.hasOwnProperty(key)) {
            counter++;
        }
    }
    var bar = new ProgressBar(':bar', {total: counter})
        
    preprocessDb.Licenses.License.forEach( function(src) {

        // create license with required fields
        var lic = new License({
            id: src["\$"].id,
            commonName: ( src.commonName ? src.commonName : src.licenseeName ),
            callSign: src.callSign,
            marketCode: src.marketCode,
            marketDesc: src.marketDesc,
            radioServiceCode: src.radioServiceCode,
            radioServiceDesc: src.radioServiceDesc,
            licensee: src.licenseeName
        }) 


        if(src.ChannelBlock[0]["\$"]) {
                lic.channel = src.ChannelBlock[0]["\$"].channel.trim()
        }

        // create Channel Block for those licenses that have them
        var cb = src.ChannelBlock[0].Frequency

        if(cb) {

            // push each Channel block into the new array, stripping empty "$" key out
            cb.forEach(function (block) {
                lic.channelBlock.push(block["\$"])
            })
        }

        var MHz = 0

        for (var j=0; j<lic.channelBlock.length; ++j) {
            var cb = lic.channelBlock[j]
            MHz += (cb.upperBand - cb.lowerBand)
            cb.lowerBand = parseInt(cb.lowerBand, 10)
            cb.upperBand = parseInt(cb.upperBand, 10)
        }
        
        lic.MHz = MHz
        
        lic.save(function (err, lic) {
            if (err) return console.error(err)
            // console.log(counter + ": updating license " + lic.callSign + " with radio code " + lic.radioServiceDesc 
            //     + " and channel " + lic.channel + " and controls MHz " + lic.MHz)
            bar.tick()
            if(bar.complete) {
                console.log("Done")
                process.exit() 
            } 
        })
    })  
})










