var api_url = '/api'

var carrier = $('#carriers')
var auction = $('#auctions')
var showBids = $('#bidsonly')
var frequency = $('#slider-range')

// helper function, formats #,##0.0 numbers
function numberWithCommas(x) {
    if(x) return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function currency(x) {
    if(x) return '$' + x.toFixed(2).toString()
}


$(document).ready(function() {

    // create the drop down list of carriers
    $.getJSON(api_url + "/getCarriers", function(carriers) {
         $.each(carriers, function (i) {
            var selectElement = $('<option>')
            selectElement.text(carriers[i])
            carrier.append(selectElement)
         })       
    })

    $("#clickable-row").click(function() {
        console.log("in click")
        clickBand($(this).data.freq)
    })


})





var licenseList = $('#licenses')
var summaryList = $('#summary')

carrier.change(function() {
    var car = ""

    $("#carriers option:selected").each(function() {
        car = $( this ).text()
    })

    getCarrier(car)
})
.change()


function getCarrier(name) {
    // create URI sanitized query variables
    var nameURI = encodeURIComponent(name)

    // get summary of licenses and pops covered for the selected carrier
    var query = "?" + (nameURI ? "commonName=" + nameURI + "&" : "")
 

     console.log(api_url + '/summarize' + query)

     $.getJSON(api_url + "/summarize" + query, function(band) {
        // clear existing table
        $('#summary tbody').empty()

        //get data
        $.each(band, function (key, data) {

            var summaryElement = $('<tr class=\'clickable-row\' data-freq=\'' + data._id[0].lowerBand + '\'>')

            iterBlocks(data._id, summaryElement)

            var MHzElement = $('<td>')
            var popsElement = $('<td>')
            var priceElement = $('<td>')
            var pricePerPOPElement = $('<td>')

            MHzElement.text(data.MHz)
            popsElement.text(numberWithCommas(data.pops))
            priceElement.text(data.price ? ('$' + numberWithCommas(data.price)) : "N/A")

            var pricePerPOP = (data.price ? (currency(data.price / (data.MHz * data.pops))) : "N/A")
            pricePerPOPElement.text( pricePerPOP )

            summaryElement.append(MHzElement)
                .append(popsElement)
                .append(priceElement)
                .append(pricePerPOPElement)

            // add row to table
            summaryList.append(summaryElement)
        })
     })
     
}


function clickBand(freq) {
    

    console.log('in clickBand' + api_url)
    $.getJSON(api_url, function(licenses) {
        // clear existing table
        $("#licenses tbody").empty()
        
        //Get data
        $.each(licenses, function (key, data) {
            var freqBlocks = Object.keys(data.channelBlock).length
            
            // create elements
            var licenseElement = $('<tr>')
            var carrierElement = $("<td>")
            var callSignElement = $("<td>")
            var marketCodeElement = $("<td>")
            var marketDescElement = $("<td>")
            var populationElement = $("<td>")
            var MHzElement = $("<td>")
            // var MHzPOPsElement = $("<td>")
            var priceElement = $("<td>")
            var pricePerPOPElement = $("<td>")
            var buyerElement = $("<td>")
            var auctionElement = $("<td>")
            var radioServiceCodeElement = $("<td>")
            var radioServiceDescElement = $("<td>")
            var channelElement = $("<td>")
            var freqBlocksElement = $("<td>")
        
            carrierElement.text(data.commonName || data.licenseeName)
            callSignElement.text(data.callSign)
            marketCodeElement.text(data.marketCode || "none")
            marketDescElement.text(data.marketDesc)
            populationElement.text( numberWithCommas(data.population) )
            MHzElement.text(data.MHz)
            // MHzPOPsElement.text( numberWithCommas(data.MHzPOPs) )
            
            // if bid data exists, fill in elements. otherwise, "N/A"
            var price, pricePerPOP, bidder, auction
            if(data.bid) {
                price = "$" + numberWithCommas(data.bid.amount.net)
                pricePerPOP = currency(data.pricePerPOP)
                bidder = data.bid.bidder
                auction = data.bid.auction.id
            } else {
                price = "N/A"
                pricePerPOP = "N/A"
                bidder = "N/A"
                auction = "N/A"
            }

            priceElement.text(price)
            pricePerPOPElement.text(pricePerPOP)
            buyerElement.text(bidder)
            auctionElement.text(auction)
            radioServiceCodeElement.text(data.radioServiceCode)
            radioServiceDescElement.text(data.radioServiceDesc)
            channelElement.text(data.channel)
            freqBlocksElement.text(freqBlocks)
            
            
            // prepare table row
            licenseElement.text("")
                .append(carrierElement)
                .append(callSignElement)
                .append(marketCodeElement)
                .append(marketDescElement)
                .append(populationElement)
                .append(MHzElement)
                // .append(MHzPOPsElement)
                .append(priceElement)
                .append(pricePerPOPElement)
                .append(buyerElement)
                .append(auctionElement)
                .append(radioServiceCodeElement)
                .append(radioServiceDescElement)
                .append(channelElement)
                // .append(freqBlocksElement)
        
            iterBlocks(data.channelBlock, licenseElement)
            // add license to the list
            licenseList.append(licenseElement)
        })
    })
}

// iterates over the frequency channels (up to 4) and inserts columns
function iterBlocks(cb, licenseElement) {
    
    for(var i=0; i<4; ++i) {

        var blockLowerElement = $("<td>")
        var blockUpperElement = $("<td>")
        

        blockLowerElement.text(cb[i] != null ? cb[i].lowerBand : "none")
        blockUpperElement.text(cb[i] != null ? cb[i].upperBand : "none")

        
        licenseElement
            .append(blockLowerElement)
            .append(blockUpperElement)
    }
}