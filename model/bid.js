var mongoose = require( 'mongoose' );

var bidSchema = mongoose.Schema({
    auction: { id: Number, desc: String },
    item: { name: String, desc: String },
    bidder: String,
    amount: { gross: Number, net: Number }
})

bidSchema.virtual('describe').get(function () {
    return this.bidder + " buys " + this.item.name + " for $" + this.amount.net
})

// bidSchema.set('toJSON', { virtuals : true })

var Bid = module.exports = mongoose.model('Bid', bidSchema)

