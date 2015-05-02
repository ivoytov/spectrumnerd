var bl = require('bl')
var fs = require("fs")
var xml2js = require('xml2js')



var parser = new xml2js.Parser()

fs.readFile(process.argv[2], 'utf8', function doneReading (err, data) { 
    if(err)
        console.error(err)
            
    parser.parseString(data, function (err, result) {
      if (err)
        console.error(err)
        
    fs.writeFile('output.json',JSON.stringify(result),'utf8', function doneWriting(err) {
        if (err)
            console.error(err)
            
    })
        
    })
})