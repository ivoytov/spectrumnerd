var mongoose = require( 'mongoose' );

var bl = require('bl'),
    fs = require('fs'),
    db = require('./model/db')

Bid = mongoose.model('Bid')

var fileList = ['./Source Spreadsheets/auction73.json',
            './Source Spreadsheets/auction92.json',
            './Source Spreadsheets/auction95.json',
            './Source Spreadsheets/auction96.json']

fileList.forEach( function(file) {
    // read JSON file
    fs.readFile(file, 'utf8', function doneReading (err, data) { 
        if(err)
            console.error(err)
        
        var preprocessDb = JSON.parse(data)
            
        preprocessDb.forEach( function(src) {
            // create bid with required fields
            var bid = new Bid({
                auction: { id: src.auction_id, desc: src.auction_description },
                item: { name: src.item_name , desc: src.item_description },
                bidder: src.pw_bidder,
                amount: { 
                    gross: parseInt(src.pwb_amount.toString().replace(/,/g, ''), 10),
                    net: parseInt(src.net_pwb_amount.toString().replace(/,/g, ''), 10)
                }
            }) 

            console.log("saving bid: " + bid.describe)

            // save to the database       
            bid.save(function (err) {
                if (err) return console.error(err)

            })
        })       
    })

})


