var mongoose = require( 'mongoose' );

var bl = require('bl'),
    fs = require('fs'),
    db = require('../model/db'),
    ProgressBar = require('progress')

County = mongoose.model('County')

// read JSON file
fs.readFile('../Source Spreadsheets/land_area.json', 'utf8', function doneReading (err, data) { 
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

    console.log("Step 2.1: Creating Land Area database of counties")
    
    preprocessDb.forEach( function(src) {
        //find the county with the same FIPS ID (called GEOID in source)
        County.find({id: src.GEOID}).exec(function (err, cty) {
            if(err) console.error(err)

            // console.log('looking for county ' + src.GEOID)
            // console.log('found county ' + cty[0].id + ' ' + cty[0].name.cname)
            cty[0].area.land = src.ALAND_SQMI
            cty[0].area.water = src.AWATER_SQMI
            cty[0].density = cty[0].population / src.ALAND_SQMI

            // save to the database       
            cty[0].save(function (err) {
                if (err) return console.error(err)
                // console.log("Saving county " + cty[0].name.cname + ", " + cty[0].name.state + ' with area ' + cty[0].area.land)
                bar.tick()
                if(bar.complete) {
                    console.log("Done")
                    process.exit() 
                } 
        })


      
        })
    })       
})

