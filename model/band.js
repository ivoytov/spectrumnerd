var mongoose = require( 'mongoose' ),
	Schema = mongoose.Schema

var bandSchema = mongoose.Schema({
    carrier: String,
    channelBlock: Array,
    price: Number,
    population: Number,
    MHz: Number
})

var Band = module.exports = mongoose.model('Band', bandSchema)

