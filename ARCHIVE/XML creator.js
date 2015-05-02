 
var http = require("http")
var bl = require('bl')
var fs = require("fs")
var xml2js = require('xml2js')

var api_url = "http://data.fcc.gov/api/spectrum-view/services/advancedSearch/getLicenses?format=JSON&radioService=cellular&pageSize=100&limit=1000"
var parser = new xml2js.Parser()
var arr = []
var combo = ""
var count_beg = 1000
var count = 10000

for (var i =count_beg; i<count; ++i) {
    responseCount(i)
  
}


function responseCount (i) {
     http.get(api_url + "&pageNum=" + (i+1).toString(), function (response) {
         
         response.pipe(bl(function (err, data) {
            if (err)
                return console.error(err)

            var str = data.toString() 
            arr[i] = str.slice(str.search( i==0 ? '<Licenses' : '<License id='),str.length-22)  
            console.log("processed page "+i)
            // parser.parseString(data.toString(), function (err, result) {
            //     if (err)
            //     return console.error(err)
            //     console.dir(util.inspect(result.Licenses,false, null))
            //     combo = result
                
            // })
        

            --count
            if (count === 0) {
                printResults()
            }
        }))
        
            
        response.on('error', console.error)
        
    })    
}

function printResults() {
    //console.dir(util.inspect(combo, false, null))
    arr.forEach(function(str) {
        
        combo += str          
    })
    
    
    fs.writeFile("File1.xml",(combo+"</Licenses>"))
    
    // var csv = json2csv.convert(combo)
        
    // fs.writeFile("File1.csv",csv)    
    
}


// var mymodule = require("./mymodule");

// mymodule(process.argv[2],process.argv[3], function doneReading (err, file) {
//     if (err)
//         return console.error('There was an error');
    
//     file.forEach(function (fname) { 
//         console.log(fname)
        
//     });
    
// });

//fs.readFile(process.argv[2], 'utf8', function doneReading (err, data) { 
//        console.log(data.split('\n').length -1);
//    });


// var index;
// var value = 0;
// for (index = 2; index<process.argv.length; ++index) {
//     value = value + Number(process.argv[index]);
//   // console.log(value);


// }

// console.log(value);


// reference the http module so we can create a webserver
// var http = require("http");

// create a server
//http.createServer(function(req, res) {
    // on every request, we'll output 'Hello world'
  //  res.end("Hello world from Cloud9!");
//}).listen(process.env.PORT, process.env.IP);

// Note: when spawning a server on Cloud9 IDE, 
// listen on the process.env.PORT and process.env.IP environment variables

// Click the 'Run' button at the top to start your server,
// then click the URL that is emitted to the Output tab of the console