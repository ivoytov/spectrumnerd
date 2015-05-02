var mongoose = require( 'mongoose' );

var licenseSchema = mongoose.Schema({
    id: Number,
    commonName: String,
    callSign: String,
    marketCode: String,
    marketDesc: String,
    population: Number,
    counties: Array,
    MHz: Number,
    channel: String,
    channelBlock: Array,
    radioServiceCode: String,
    radioServiceDesc: String
})

licenseSchema.virtual('MHzPOPs').get(function() {
    return this.population * this.MHz
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

