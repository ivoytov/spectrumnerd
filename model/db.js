// Bring Mongoose into the app
var mongoose = require( 'mongoose' )
var uriUtil = require('mongodb-uri')

// Build the connection string
// var dbURI = 'mongodb://localhost/my_database';
var mongodbUri = process.env.MONGOLAB_URI
var dbURI = mongodbUri ? uriUtil.formatMongoose(mongodbUri) : 'mongodb://localhost/spectrumdb';

// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
  console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});


// BRING IN SCHEMAS & MODELS
require('./license')
require('./county')
require('./bid')
require('./band')