var mongoose = require( 'mongoose' );

var bl = require('bl'),
    fs = require('fs'),
    db = require('../model/db'),
    ProgressBar = require('progress')

Bid = mongoose.model('Bid')

var fileList = [
    '../Source Spreadsheets/auction4.json',
    '../Source Spreadsheets/auction5.json', 
    '../Source Spreadsheets/auction16.json', 
    '../Source Spreadsheets/auction34.json',    
    '../Source Spreadsheets/auction35.json',      
    '../Source Spreadsheets/auction43.json', 
    '../Source Spreadsheets/auction58.json',     
    '../Source Spreadsheets/auction60.json',
    '../Source Spreadsheets/auction65.json',
    '../Source Spreadsheets/auction66.json',
    '../Source Spreadsheets/auction71.json',
    '../Source Spreadsheets/auction73.json',
    '../Source Spreadsheets/auction78.json',
    '../Source Spreadsheets/auction92.json',
    '../Source Spreadsheets/auction95.json',
    '../Source Spreadsheets/auction96.json'
]

console.log("Step 4: Reading auction files and savings bids")

var file_counter = fileList.length
var file_bar = new ProgressBar(':bar', { total: file_counter })


fileList.forEach( function(file) {

    console.log("Reading data from file: " + file)
    // read JSON file
    fs.readFile(file, 'utf8', function doneReading (err, data) { 
        if(err)
            console.error(err)
        
        debugger
        var preprocessDb = JSON.parse(data)
        
        var key, counter = 0;
        for(key in preprocessDb) {
            if(preprocessDb.hasOwnProperty(key)) {
                counter++;
            }
        }
        var bar = new ProgressBar(':bar', { total: counter })



        preprocessDb.forEach( function(src) {
            // create fields based on auction format
            var auction_id,
                auction_description,
                item_name,
                item_description,
                pw_bidder,
                pwb_amount,
                net_pwb_amount

            if(src.Auction_id) {
                debugger


                auction_id = src.Auction_id
                auction_description = src.Auction_Desc

                switch(src.Auction_id) {
                    case 60:
                        item_name = src.bip_id
                        pw_bidder = src.bidder_name
                        pwb_amount = src.bid_amt
                        net_pwb_amount = src.net_bid_amt
                        break
                    case 65:
                    case 16:
                    case 34:
                    case 35:
                    case 43:
                    case 58:
                    case 71:
                        // Auctions that have a different nomenclature in source files
                        pw_bidder = src.bidder_name
                        pwb_amount = src.bid_amt
                        net_pwb_amount = src.net_bid_amt
                        item_name = src.bip_name
                        item_description = src.bip_desc
                        break
                    default:
                        item_name = src.bip_name
                        pw_bidder = src.prov_winner
                        pwb_amount = src.price
                        net_pwb_amount = src.price // FIXME not actually net price
                        item_description = src.bip_desc

                }

            } else if(src.auction_id) {
                auction_id = src.auction_id,
                auction_description = src.auction_description,
                item_name = src.item_name,
                item_description = src.item_description,
                pwb_amount = src.pwb_amount,
                net_pwb_amount = src.net_pwb_amount,
                pw_bidder = src.pw_bidder
            } else if(src.BID_TYPE) {
                auction_id = 4,
                auction_description = 'Broadband PCS A and B Block',
                item_name = 'CW-MTA' + src.MARKET.slice(1,4) + '-' + src.FREQ_BLOCK,
                item_description = src.MARKET,
                pwb_amount = src.BID_AMT,
                net_pwb_amount = src.BID_AMT,
                pw_bidder = src.NAME
            } else {
                bar.tick()
                return console.error('shouldn\'t be here '+JSON.stringify(src))
            }



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

            // console.log("saving bid: " + bid.describe)

            // save to the database       
            bid.save(function (err) {
                if (err) return console.error(err)
                bar.tick()
                if(bar.complete) {
                    console.log("Done with auction " + bid.auction.id)
                    file_bar.tick()
                    if(file_bar.complete) {
                        console.log("Done with all auction files")
                        process.exit()
                    }
                } 
            })
        })       
    })

})


