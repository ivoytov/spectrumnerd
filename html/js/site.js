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

    // clear map and chart
    $("#map").empty()
    $("#chart").empty()
 

     console.log(api_url + query)

     $.getJSON(api_url + query, function(band) {
        // clear existing table
        $('#summary tbody').empty()

        // setup county list for map
        var MHzbyCounty = []

        //create table for each band in data
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

            // add counties in the band to county map
            data.counties.forEach(function(id) {
                MHzbyCounty[id] =+ data.MHz

            })
        })
        
        // make map
        makeMap(MHzbyCounty)

        // make chart
        makeChart(band)

     })
     
}

function makeMap(MHzbyCounty) {


    var width = 960*0.50,
    height = 600*0.50;

    var rateById = d3.map(MHzbyCounty);
    var FIPS;

    var quantize = d3.scale.quantize()
        .domain([0, 70])
        .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

    var projection = d3.geo.albersUsa()
        .scale(1280*0.5)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    queue()
        .defer(d3.json, "us.json")
        .defer(d3.json, "FIPS.json")
        .await(ready);

    function mouseOver(d) {
        d3.select("#tooltip").transition().duration(200).style("opacity", .9);

        d3.select("#tooltip").html(toolTip(d.id, MHzbyCounty[d.id] || 'None')) 
        .style("left", (d3.event.pageX) + "px") 
        .style("top", (d3.event.pageY - 28) + "px");
    }

    function mouseOut() {
        d3.select("#tooltip").transition().duration(500).style("opacity", 0);
    }

    function ready(error, us, f) {
        if(error) console.error(error)

        FIPS = f

        svg.append("g")
           .attr("class", "counties")
          .selectAll("path")
           .data(topojson.feature(us, us.objects.counties).features)
          .enter().append("path")
           .attr("class", function(d) { 
                if(rateById.get(d.id) == null) return quantize(0)
                return quantize(rateById.get(d.id)); 
            })
          .attr("d", path)

          .on("mouseover", mouseOver)
          .on("mouseout", mouseOut)

        svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
          .attr("class", "states")
          .attr("d", path);

    }

    d3.select("#map").style("height", height + "px");




    d3.select("#map").selectAll("path")
        


}


function toolTip(n, d){ /* function to create html content string in tooltip div. */
        return "<h4>"+n+"</h4><table>"+
            "<tr><td>MHz</td><td>"+(d)+"</td></tr>"+
            "</table>";
    }

function makeChart(bands) {
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960*0.8 - margin.left - margin.right,
    height = 500*0.8 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "MM");

    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // d3.tsv("data.tsv", type, function(error, data) {
    //   x.domain(data.map(function(d) { return d.letter; }));
    //   y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

    // create the frequency axis by looping through channelBlocks
    var frequencies = []
    bands.forEach(function(b) {
        b.channelBlock.forEach(function(cb) {
            frequencies.push({start: cb.lowerBand, end: cb.upperBand
                , population: b.population / 1000000})
        })
    })
    x.domain(frequencies.map(function(d) { return d.start }))
    y.domain([0, 330])
    


      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Population");

      svg.selectAll(".bar")
          .data(frequencies)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d.start); })
          .attr("width", x.rangeBand())
          .attr("y", function(d) { return y(d.population); })
          .attr("height", function(d) { return height - y(d.population); });

    // });

    // function type(d) {
    //   d.frequency = +d.frequency;
    //   return d;
    // }
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