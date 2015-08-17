var mongoose = require( 'mongoose' ),
    Schema = mongoose.Schema

var licenseSchema = Schema({
    id: Number,
    commonName: String,
    callSign: String,
    marketCode: String,
    marketDesc: String,
    population: {type: Number, index: true, default: 0},
    area: Number,
    counties: Array,
    MHz: Number,
    channel: String,
    channelBlock: Array,
    radioServiceCode: String,
    radioServiceDesc: String,
    bid: Object
})

licenseSchema.virtual('MHzPOPs').get(function() {
    return this.population * this.MHz
})

licenseSchema.virtual('pricePerPOP').get(function(argument) {
    if(this.bid == null) return null
    return this.bid.amount.gross / this.MHzPOPs
})

licenseSchema.virtual('density').get(function(argument) {
    if(this.area == null) return null
    return this.population / this.area
})

licenseSchema.methods.list = function () {
    var description = this.commonName 
        ? "Carrier name is " + this.commonName + " with call sign " +
            this.callSign + " at market code " + this.marketCode
        : "I don't have a carrier, call sign " + this.callSign
    return description
}

licenseSchema.set('toJSON', { virtuals : true })

var License = module.exports = mongoose.model('License', licenseSchema)



