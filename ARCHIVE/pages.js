var mongoose = require( 'mongoose' ),
    License = mongoose.model('License');

exports.index = function (req, res) {
  License.create({
    commonName : "Verizon",
    callSign: "AAA",
  }, function(err, lic) {
    var strOutput;
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    if (err) {
      console.log(err);
      strOutput = 'Oh dear, we\'ve got an error';
    } else {
      console.log('License created: ' + lic);
      lic.list
    }
    res.write(strOutput);
    res.end();
  });
};