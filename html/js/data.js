var api_url = '/api'

var maxSpectrumValue = 90,
    car = "Verizon Wireless"


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

            var optionElement = $('<option>').attr('value',carriers[i]).text(carriers[i])
            if(carriers[i] === car) optionElement.attr('selected','selected')
            $('#carriers_select').append(optionElement)

         })

        
        car = window.location.hash ? decodeURI(window.location.hash.substr(1)) : "Verizon Wireless"

        getCarrier(car)
        $("#carrier_name").text(car)

        $("#licenses_div").hide()

        mixpanel.track("Spectrum page");

 
    })


    // handle band row clicks
    $("#summary tbody").on("click", "tr", function(event) {
        clickBand($(this).data('channelBlock'))

    })

    // handle clicks on carrier names in left hand column
    $("#carriers_list").on("click", "li", function(event) {
        $('#carriers_select').val($(this).text())
        getCarrier($(this).text())


    })

    $('#carriers_select').change(function () {
        getCarrier($('#carriers_select').val())
    })


})



var licenseList = $('#licenses')
var summaryList = $('#summary')



function getCarrier(name) {

    // hide the license table at the bottom - moving to new carrier
    $("#licenses_div").hide()
    $("#licenses tbody").empty()

    car = name

    $("#carrier_name").text(car)
    mixpanel.track("Changed carrier");

    // create URI sanitized query variables
    var nameURI = encodeURIComponent(name)

    // get summary of licenses and pops covered for the selected carrier
    var query = "/getBands?" + (nameURI ? "commonName=" + nameURI + "&" : "")

    // clear map and chart
    $("#map").empty()
    $("#chart").empty()
    $("#plot").empty()
 

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

            maxSpectrumValue = 90

            // add counties in the band to county map
            data.counties.forEach(function(id) {
                MHzbyCounty[id] = data.MHz + (MHzbyCounty[id] || 0)

                // update the max value (used for colors in the map)
                if (MHzbyCounty[id] > maxSpectrumValue) maxSpectrumValue = MHzbyCounty[id]
            })
        })
        
        // make map
        makeMap(MHzbyCounty)

        // make chart
        makeChart(band)

    })

    // get list of auction bids by the carrier 
    var query = "/getDensity?" + (nameURI ? "commonName=" + nameURI + "&" : "")

    $.getJSON(api_url + query, function(bids) {
        // make scatter plot
        makePlot(bids)
    })

}






function makeChart(bands) {

    function toolTip(band){ /* function to create html content string in tooltip div. */
        return "<h4>" + iterBlocks(band.channelBlock) + "</h4><table>" 
            + "<tr><td>MHz</td><td>"+band.MHz+"</td></tr>"
            + "<tr><td>Population</td><td>" + numberWithCommas(band.population) + "</td></tr>"
            + "</table>";
    }

    function pickBand(d) {
        for(var i=0; i<bands.length; ++i) {
            for (var j=0; j<bands[i].channelBlock.length; ++j) {
                if(d.start === bands[i].channelBlock[j].lowerBand) {
                    return bands[i]
                }
            }
        }
    }

    function mouseOver(d) {
        d3.select("#tooltip").transition().duration(200).style("opacity", .9);

        // find the channel block that includes this band
        var selectedBand = pickBand(d)


        // highlight the other frequencies in this channel block
        svg.selectAll(".bar")
            .filter(function(d, i) {
                for(var i=0; i<selectedBand.channelBlock.length; ++i) {
                    if(d.start == selectedBand.channelBlock[i].lowerBand) {
                        return 1
                    } 

                }
            })
            .style("fill", "brown")

        d3.select("#tooltip").html(toolTip(selectedBand)) 
        .style("left", (d3.event.pageX - $("#carriers_list").width()) + "px") 
        .style("top", (d3.event.pageY - 28) + "px");
    }

    function mouseOut() {
        d3.select("#tooltip").transition().duration(500).style("opacity", 0);
        svg.selectAll(".bar")
        .style("fill", "steelblue")
    }

    function onClick(d) {
        clickBand(pickBand(d).channelBlock)
    }

    var margin = {top: 20, right: 20, bottom: 40, left: 45},
    width = 768 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

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
    x.domain([700, 2600])
    y.domain([0, 330])
    


      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
        .append("text")
          .attr("y", 30)
          .attr("x", width / 2 - 10)
          .attr("dx", ".71em")
          .style("text-anchor","end")
          .text("Frequency (MHz)")

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -40)
          .attr("x", -height / 2 + 50)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Population (MM)");

      svg.selectAll(".bar")
          .data(frequencies)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d.start); })
          .attr("width", function(d) { return x(d.end) - x(d.start)})
          .attr("y", function(d) { return y(d.population); })
          .attr("height", function(d) { return height - y(d.population); })
          .on("mouseover", mouseOver)
          .on("mouseout", mouseOut)
          .on("click", onClick)

    // });


}

// create plot of price paid in different auction vs. density of area
function makePlot(bids) {
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 760 - margin.left - margin.right,
    height = 338 - margin.top - margin.bottom;

    /* 
     * value accessor - returns the value to encode for a given data object.
     * scale - maps value to a visual display encoding, such as a pixel position.
     * map function - maps from data value to display value
     * axis - sets up axis
     */ 

    // setup x 
    var xValue = function(d) { return d.density}, // data -> value
        xScale = d3.scale.linear().range([0, width]), // value -> display
        xMap = function(d) { return xScale(xValue(d))}, // data -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom")

    // setup y
    var yValue = function(d) { return d.pricePerPOP}, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function(d) { return yScale(yValue(d))}, // data -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    // setup fill color
    var cValue = function(d) { return d.bid.auction.id + ': ' + d.bid.auction.desc},
        color = d3.scale.category10()

    // add the graph canvas to the body of the webpage
    var svg = d3.select("#plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // add the tooltip area to the webpage
    var tooltip = d3.select("#tooltip")


    // don't want dots overlapping axis, so add in buffer to data domain
  xScale.domain([0,Math.max(d3.max(bids, xValue),5000)]);
  yScale.domain([0,10]);

  // x-axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("People per Square Mile");

  // y-axis
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("$/MHz-POP");

  // draw dots
  svg.selectAll(".dot")
      .data(bids)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", xMap)
      .attr("cy", yMap)
      .style("fill", function(d) { return color(cValue(d));}) 
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html(d.bid.item.desc + "<br/>" + numberWithCommas(Math.round(xValue(d)))
            + " pop/sq mile, " + currency(yValue(d)) + " $/Mhz-POP <br/>"
            + "Auction " + d.bid.auction.id + ": " + d.bid.auction.desc )
               .style("left", (d3.event.pageX - $("#carriers_list").width() + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

      // draw legend
      var legend = svg.selectAll("#plot-legend")
          .data(color.domain())
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      // draw legend colored rectangles
      legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", color);

      // draw legend text
      legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d })

}

// create map of the USA with counties colored by amount of spectrum
function makeMap(MHzbyCounty) {
    var width = 640,
    height = 400;

    var FIPS;

    var quantize = d3.scale.quantize()
        .domain([0, maxSpectrumValue])
        .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

    var projection = d3.geo.albersUsa()
        .scale(640)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)

    queue()
        .defer(d3.json, "us.json")
        .defer(d3.json, "FIPS.json")
        .await(ready);

    function toolTip(n, d){ /* function to create html content string in tooltip div. */
        return "<h4>"+n.name.cname + ', ' + n.name.state +"</h4><table>" 
            + "<tr><td>MHz</td><td>"+(d)+"</td></tr>"
            + "<tr><td>Population</td><td>" + numberWithCommas(n.population) + "</td></tr>"
            + "</table>";
    }

    function mouseOver(d) {
        d3.select("#tooltip").transition().duration(200).style("opacity", .9);

        d3.select("#tooltip").html(toolTip(FIPS[d.id], MHzbyCounty[d.id] || 'None')) 
        .style("left", (d3.event.pageX - $("#carriers_list").width()) + "px") 
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
                return quantize(MHzbyCounty[d.id] || 0); 
            })
          .attr("d", path)

          .on("mouseover", mouseOver)
          .on("mouseout", mouseOut)

        svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
          .attr("class", "states")
          .attr("d", path);

        mixpanel.track("Loaded map");

    }

    d3.select("#map").style("height", height + "px");

    d3.select("#map").selectAll("path")
    
    // make legend

    // var legend = d3.select('#legend')
    //                 .append('ul')
    //                 .attr('class', 'list-inline');

    // var keys = legend.selectAll('li.key')
    //     .data(quantize.range());


    // keys.enter().append('li')
    //     .attr('class', 'key')
    //     .style('border-top-color', String)
    //     .text(function(d) {
    //         var r = quantize.range().invertExtent(d);
    //         return r[0];
    //     });


}



function clickBand(channelBlock) {
    $("#licenses_div").show()

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
            var callSignLink = $('<a>', {
                text: data.callSign,
                target: '_blank',
                href: "http://wireless2.fcc.gov/UlsApp/UlsSearch/license.jsp?licKey=" + data.id,
                title: "Link to FCC.gov"
            })
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
            callSignElement.append(callSignLink)
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
    mixpanel.track("Clicked on band");

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

