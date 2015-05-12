var mongoose = require( 'mongoose' );

var bl = require('bl'),
    fs = require('fs'),
    db = require('./model/db')

Bid = mongoose.model('Bid')

var fileList = [
            './Source Spreadsheets/auction5.json',
            './Source Spreadsheets/auction66.json',
            './Source Spreadsheets/auction73.json',
            './Source Spreadsheets/auction92.json',
            './Source Spreadsheets/auction95.json',
            './Source Spreadsheets/auction96.json'
            ]
            

fileList.forEach( function(file) {
    // read JSON file
    fs.readFile(file, 'utf8', function doneReading (err, data) { 
        if(err)
            console.error(err)
        
        var preprocessDb = JSON.parse(data)
            
        preprocessDb.forEach( function(src) {
            // create fields based on auction format
            var auction_id,
                auction_description,
                item_name,
                item_description,
                pw_bidder,
                pwb_amount,
                net_pwb_amount

            console.log(file)
            if(src.Auction_id) {
                auction_id = src.Auction_id,
                auction_description = src.Auction_Desc,
                item_name = src.bip_name,
                item_description = src.bip_desc,
                pwb_amount = src.price,
                net_pwb_amount = src.price, // FIXME not actually net price
                pw_bidder = src.prov_winner
            } else if(src.auction_id) {
                auction_id = src.auction_id,
                auction_description = src.auction_description,
                item_name = src.item_name,
                item_description = src.item_description,
                pwb_amount = src.pwb_amount,
                net_pwb_amount = src.net_pwb_amount,
                pw_bidder = src.pw_bidder
            } else return console.error('shouldn\'t be here')



            // create bid with required fields
            var bid = new Bid({
                auction: { id: auction_id, desc: auction_description },
                item: { name: item_name , desc: item_description },
                bidder: pw_bidder,
                amount: { 
                    gross: parseInt(pwb_amount.toString().replace(/,/g, ''), 10),
                    net: parseInt(net_pwb_amount.toString().replace(/,/g, ''), 10)
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


