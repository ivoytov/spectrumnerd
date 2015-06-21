var api_url = '/api'

var guesses = [], 
	carriers,
	answer,
    score = { correct: 0, total: 0 }

var maxSpectrumValue = 90



$(document).ready(function() {

    // create the drop down list of carriers
    $.getJSON(api_url + "/getCarriers", function(cars) {
        carriers  = cars

       	playGame()

        mixpanel.track("Game page");

 
    })

    function processAnswer(e) {

    	var resultRowElement = $('<tr>')
    	var carrierElement = $('<td>')
    	var resultElement = $('<td>')

    	carrierElement.text(answer)
        score.total++

    	if(answer == $(this).text()) {
			newAlert('success', answer +' is correct')
			resultElement.text("Correct")
            score.correct++
    	}
    	else {
    		resultElement.text("Wrong")
    		newAlert('danger',"wrong, right answer: " + answer)
    	}

    	resultRowElement.append(carrierElement)
    					.append(resultElement)
    	$('#reportcard').append(resultRowElement)

    	playGame()

        mixpanel.track("Played a round of the game");

    }

    function newAlert (type, message) {
    	$("#alert-area").append($("<div class='alert alert-" + type + " fade in' data-alert><p> " + message + " </p></div>"));
    	$(".alert").delay(1000).fadeOut("slow", function () { $(this).remove(); });
	}

    $('#car1').on('click', processAnswer)
    $('#car2').on('click', processAnswer)
    $('#car3').on('click', processAnswer)


})



function playGame() {

    $('#score').text(score.correct + ' points / ' + score.total + ' attempts')

	guesses[0] = carriers[Math.floor(Math.random() * carriers.length + 1)]
    guesses[1] = carriers[Math.floor(Math.random() * carriers.length + 1)]
    guesses[2] = carriers[Math.floor(Math.random() * carriers.length + 1)]


	var i = Math.floor(Math.random()*3)
	answer = guesses[i]
    getCarrier(answer)


	$("#car1").html(guesses[0])
	$("#car2").html(guesses[1])
	$("#car3").html(guesses[2])

}




function getCarrier(name) {
    // create URI sanitized query variables
    var nameURI = encodeURIComponent(name)

    // get summary of licenses and pops covered for the selected carrier
    var query = "/getBands?" + (nameURI ? "commonName=" + nameURI + "&" : "")

    // clear map and chart
    $("#map").empty() 


     console.log(api_url + query)

     $.getJSON(api_url + query, function(band) {

        // setup county list for map
        var MHzbyCounty = []

        maxSpectrumValue = 90

        //create table for each band in data
        $.each(band, function (key, data) {

            // add counties in the band to county map
            data.counties.forEach(function(id) {
                MHzbyCounty[id] = data.MHz + (MHzbyCounty[id] || 0)
                
                // update the max value (used for colors in the map)
                if (MHzbyCounty[id] > maxSpectrumValue) maxSpectrumValue = MHzbyCounty[id]

            })
        })
        
        // make map
        makeMap(MHzbyCounty)

     })
     
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

// iterates over the frequency channels (up to 4) and inserts columns
function iterBlocks(cb) {
    var formatted = ""
    
    for(var i=0; i<cb.length; ++i) {
        formatted += cb[i].lowerBand + '-' + cb[i].upperBand
        if(i<cb.length-1) formatted += ', '
    }
    return formatted
}

// helper function, formats #,##0.0 numbers
function numberWithCommas(x) {
    if(x) return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
