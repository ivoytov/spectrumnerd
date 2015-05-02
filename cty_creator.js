var mongoose = require( 'mongoose' );

var bl = require('bl'),
    fs = require('fs'),
    db = require('./model/db')

County = mongoose.model('County')

// read JSON file
fs.readFile('population.json', 'utf8', function doneReading (err, data) { 
    if(err)
        console.error(err)
    
    var preprocessDb = JSON.parse(data)
        
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
        })
    })       
})

