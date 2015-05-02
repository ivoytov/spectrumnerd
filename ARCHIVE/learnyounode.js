var http = require("http")
var map = require('through2-map')
var url = require('url')

function createTime(iso) {
    // return JSON object like such { "hour": 14, "minute": 23, "second": 15 }
    return { "hour": iso.getHours(), "minute": iso.getMinutes(), "second": iso.getSeconds() }
    
}

function createUnixTime(iso) {
    // return JSON object with UNIX epoch time in milliseconds like such { "unixtime": 12341234123 }
    
    return { "unixtime": iso.getTime() }
}

var server = http.createServer(function (req,res) {
    
     // write header
    res.writeHead(200, { 'Content-Type': 'application/json' })
    var qry = url.parse(req.url, true)
    var date = new Date(qry.query.iso)
    var result
    
    if (qry.pathname === '/api/parsetime') {
        // convert ISO date to JSON; query contains the time in unix date format
        result = createTime(date)
    }
    
    if(qry.pathname === '/api/unixtime') {
        // convert ISO date to JSON
        result = createUnixTime(date) 
    }
    res.end(JSON.stringify(result))

})

server.listen(process.argv[2])

// var net = require("net")
// var date = new Date()

// function zeroFill (i) {
//     return (i<10 ? "0" : "")+i
// }

// function makeDate() {
//     return date.getFullYear() + "-" + 
//         zeroFill(date.getMonth()+1) + "-" + 
//         zeroFill(date.getDate()) + " " +
//         date.getHours() + ":" + 
//         date.getMinutes()
// }

// var server = net.createServer(function (socket) {
//     // socket logic
//     socket.end(makeDate() +'\n')
    
// })

// server.listen(process.argv[2])