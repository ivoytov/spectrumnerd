var mongoose = require( 'mongoose' );

var countySchema = mongoose.Schema({
    id: Number,
    name: { cname: String, state: String},
    population: {type: Number, default: 0},
    cma: Number,
    bta: Number,
    mta: Number,
    rpc: Number,
    bea: Number,
    mea: Number,
    rea: Number,
    eag: Number,
    vpc: Number,
    psr: Number
})

countySchema
.virtual('name.address')
.get(function() {
    return this.name.cname + ', ' + this.name.state
})

var County = module.exports = mongoose.model('County', countySchema)

module.exports = function marketCode(marketCode, callback) {

}

