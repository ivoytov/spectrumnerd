var fs = require("fs");
var path = require("path");
var arr = [];

module.exports = function (dir, ext, doneReading) {
    
    fs.readdir(dir, function (err, list) {
        if(err)
            return doneReading(err); // early return
            
        arr = list.filter(function (file) {

             if (path.extname(file) === "." + ext) 
                return file;
        });
        doneReading(null, arr);
    });
}