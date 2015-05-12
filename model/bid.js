var mongoose = require( 'mongoose' ),
	Schema = mongoose.Schema

var bidSchema = mongoose.Schema({
    auction: { id: Number, desc: String },
    item: { name: String, desc: String },
    bidder: String,
    amount: { gross: Number, net: Number },
    _license: { type: Schema.Types.ObjectId, ref: 'License' }
})

bidSchema.virtual('describe').get(function () {
    return this.bidder + " buys " + this.item.name + " for $" + this.amount.net
})

bidSchema.set('toJSON', { virtuals : false })

var Bid = module.exports = mongoose.model('Bid', bidSchema)

