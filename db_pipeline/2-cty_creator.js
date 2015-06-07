var mongoose = require( 'mongoose' );

var bl = require('bl'),
    fs = require('fs'),
    db = require('../model/db'),
    ProgressBar = require('progress')

County = mongoose.model('County')

// read JSON file
fs.readFile('../Source Spreadsheets/population.json', 'utf8', function doneReading (err, data) { 
    if(err)
        console.error(err)
    
    var preprocessDb = JSON.parse(data)

    var key, counter = 0;
    for(key in preprocessDb) {
        if(preprocessDb.hasOwnProperty(key)) {
            counter++;
        }
    }
    var bar = new ProgressBar(':bar', {total: counter})

    console.log("Step 2: Creating Population database of counties")
        
    preprocessDb.forEach( function(src) {

        // create license with required fields
        var cty = new County({
            id: src.FIPS,
            name: { cname: src.Name, state: src.State },
            population: src.Population,
            cma: src.cma,
            bta: src.bta,
            mta: src.mta,
            rpc: src.rpc,
            bea: src.bea,
            mea: src.mea,
            rea: src.rea,
            eag: src.eag,
            vpc: src.vpc,
            psr: src.psr
        }) 

        // save to the database       
        cty.save(function (err) {
            if (err) return console.error(err)
            // console.log("Saving county " + cty.name.cname + ", " + cty.name.state)
            bar.tick()
            if(bar.complete) {
                console.log("Done")
                process.exit() 
            } 
        })
    })       
})

