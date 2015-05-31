
var bl = require('bl'),
    fs = require('fs')


// read JSON file
fs.readFile('population.json', 'utf8', function doneReading (err, data) { 
    if(err)
        console.error(err)
    
    var preprocessDb = JSON.parse(data)
    var output = []
        
    preprocessDb.forEach( function(src) {

        // create license with required fields
        var cty = { 
            id: src.FIPS,
            name: { cname: src.Name, state: src.State },
            population: src.Population,
        }
        output[src.FIPS] = cty
    })      

    fs.writeFile('html/FIPS.json', JSON.stringify(output))
})

