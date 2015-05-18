var api_url = '/api'

var auction = $('#auctions')
var showBids = $('#bidsonly')
var frequency = $('#slider-range')

var car = "Verizon"


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

            var liElement = $('<li>')
            var hrefElement = $('<a>')
            hrefElement.text(carriers[i])

            $('#carriers_list').append(liElement.append(hrefElement))

         })      

        getCarrier(car)
        $("#carrier_name").text(car)

        $("#licenses_div").hide()
 
    })


    // handle band row clicks
    $("#summary tbody").on("click", "tr", function(event) {
        $("#licenses_div").show()
        clickBand($(this).data('channelBlock'))
    })

    // handle clicks on carrier names in left hand column
    $("#carriers_list").on("click", "li", function(event) {
        // hide the license table at the bottom - moving to new carrier
        $("#licenses_div").hide()
        $("#licenses tbody").empty()

        car = $(this).text()

        $("#carrier_name").text(car)
        getCarrier(car)
    })


})



var licenseList = $('#licenses')
var summaryList = $('#summary')



function getCarrier(name) {
    // create URI sanitized query variables
    var nameURI = encodeURIComponent(name)

    // get summary of licenses and pops covered for the selected carrier
    var query = "/getBands?" + (nameURI ? "commonName=" + nameURI + "&" : "")
 

     console.log(api_url + query)

     $.getJSON(api_url + query, function(band) {
        // clear existing table
        $('#summary tbody').empty()

        //get data
        $.each(band, function (key, data) {

            var summaryElement = $('<tr>')
            summaryElement.data('channelBlock', data.channelBlock)

            var cbElement = $('<td>')
            var MHzElement = $('<td>')
            var popsElement = $('<td>')
            var priceElement = $('<td>')
            var pricePerPOPElement = $('<td>')

            cbElement.text(iterBlocks(data.channelBlock))
            MHzElement.text(data.MHz)
            popsElement.text(numberWithCommas(data.population))
            priceElement.text(data.price ? ('$' + numberWithCommas(data.price)) : "N/A")

            var pricePerPOP = (data.price ? (currency(data.price / (data.MHz * data.population))) : "N/A")
            pricePerPOPElement.text( pricePerPOP )

            summaryElement.append(cbElement)
                .append(MHzElement)
                .append(popsElement)
                .append(priceElement)
                .append(pricePerPOPElement)

            // add row to table
            summaryList.append(summaryElement)
        })
        
        // make map
        //makeMap(MHzbyCounty)

     })
     
}

function makeMap(MHzbyCounty) {
    var countyElement = $('<li>')
    console.log( JSON.stringify(MHzbyCounty))
    $("#map").append(countyElement)

    // var width = 960,
    // height = 600;

    // var rateById = d3.map();

    // var quantize = d3.scale.quantize()
    //     .domain([0, 0.15])
    //     .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

    // var projection = d3.geo.albersUsa()
    //     .scale(1280)
    //     .translate([width / 2, height / 2]);

    // var path = d3.geo.path()
    //     .projection(projection);

    // var svg = d3.select("#map").append("svg")
    //     .attr("width", width)
    //     .attr("height", height);

    // queue()
    //     .defer(d3.json, "us.json")
    //     .defer(d3.tsv, "js/unemployment.tsv", function(d) { rateById.set(d.id, +d.rate); })
    //     .await(ready);

    // function ready(error, us) {
    //   svg.append("g")
    //       .attr("class", "counties")
    //     .selectAll("path")
    //       .data(topojson.feature(us, us.objects.counties).features)
    //     .enter().append("path")
    //       .attr("class", function(d) { return quantize(rateById.get(d.id)); })
    //       .attr("d", path);

    //   svg.append("path")
    //       .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    //       .attr("class", "states")
    //       .attr("d", path);
    // }

    // d3.select(self.frameElement).style("height", height + "px");
}





function clickBand(channelBlock) {
    var query_url = '?commonName=' + encodeURIComponent(car) 
        // + '&frequencyFrom=' + encodeURIComponent(channelBlock[0].lowerBand) 
        // + '&frequencyTo=' + encodeURIComponent(channelBlock[channelBlock.length-1].upperBand)
        + '&channelBlock=' + encodeURIComponent(JSON.stringify(channelBlock))

    console.log(api_url + query_url)

    // clear existing table
    $("#licenses tbody").empty()

    // set title of the section 
    $('#licenses_title').text('Licenses in Spectrum Band ' + iterBlocks(channelBlock) + ' MHz')
        // + channelBlock[0].lowerBand + '-' 
        // + channelBlock[1].upperBand + ' MHz')

    // jump to relevant section
    $("body, html").animate({ 
        scrollTop: $('#licenses_title').offset().top 
    }, 600);

    $.getJSON(api_url + query_url, function(licenses) {
        //Get data
        $.each(licenses, function (key, data) {
            
            // create elements
            var licenseElement = $('<tr>')

            var cbElement = $('<td>')
            var carrierElement = $("<td>")
            var callSignElement = $("<td>")
            var marketCodeElement = $("<td>")
            var marketDescElement = $("<td>")
            var populationElement = $("<td>")
            var MHzElement = $("<td>")
            var priceElement = $("<td>")
            var pricePerPOPElement = $("<td>")
            var buyerElement = $("<td>")
            var auctionElement = $("<td>")
            var radioServiceCodeElement = $("<td>")
            var radioServiceDescElement = $("<td>")
            var channelElement = $("<td>")
        
            cbElement.text(iterBlocks(data.channelBlock))
            carrierElement.text(data.commonName || data.licenseeName)
            callSignElement.text(data.callSign)
            marketCodeElement.text(data.marketCode || "none")
            marketDescElement.text(data.marketDesc)
            populationElement.text( numberWithCommas(data.population) )
            MHzElement.text(data.MHz)
            
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
            
            
            // prepare table row
            licenseElement.text("")
                .append(cbElement)
                .append(callSignElement)
                .append(marketCodeElement)
                .append(marketDescElement)
                .append(populationElement)
                .append(MHzElement)
                .append(priceElement)
                .append(pricePerPOPElement)
                .append(buyerElement)
                .append(auctionElement)
                .append(radioServiceCodeElement)
                .append(radioServiceDescElement)
                .append(channelElement)
        
            // iterBlocks(data.channelBlock, licenseElement)
            // add license to the list
            licenseList.append(licenseElement)
        })
    })
}

// iterates over the frequency channels (up to 4) and inserts columns
function iterBlocks(cb) {
    var formatted = ""
    
    for(var i=0; i<cb.length; ++i) {
        formatted += cb[i].lowerBand + '-' + cb[i].upperBand
        if(i<cb.length-1) formatted += ', '
    }
    return formatted
}