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

        // create license with required fields
        var lic = new License({
            id: src["\$"].id,
            commonName: src.commonName,
            callSign: src.callSign,
            marketCode: src.marketCode,
            marketDesc: src.marketDesc,
            radioServiceCode: src.radioServiceCode,
            radioServiceDesc: src.radioServiceDes
        }) 

        // create Channel Block for those licenses that have them
        var cb = src.ChannelBlock[0].Frequency

        if(cb) {

            // push each Channel block into the new array, stripping empty "$" key out
            cb.forEach(function (block) {
                lic.channelBlock.push(block["\$"])
            })
        }
        
        lic.save(function (err, lic) {
            if (err) return console.error(err)
        })
    })       
})






