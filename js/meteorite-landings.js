d3.select(window).on("resize", sizeChange);

/* Projection */

var scale = 150;

var projection = d3.geo.mercator()
        .scale(scale);

var path = d3.geo.path()
		.projection(projection);

var svg = d3.select("#visual-container")
		.append("svg")
        .attr("id", "visual")
		.attr("width", "100%")
        .append("g")
        .attr("id", "map");

/* Draw map */

d3.json("json/countries.topo.json", function(error, json) {
    if (error) return console.error(error);
    
    svg.selectAll(".countries")
        .data(topojson.feature(json, json.objects.countries).features)
        .enter()
        .append("path")
        .attr("class", "countries")
        .attr("d", path);
});

/* Functions */

function sizeChange() {
	    d3.selectAll("#map, #plot").attr("transform", "scale(" + $("#visual-container").width()/900 + ") translate(-25 100)");
	    $("svg").height($("#visual-container").width()*0.618);
}

function playAnimation() {
    // Disable play button and reset button
    d3.select("#playButton").attr("disabled", "disabled");
    d3.select("#resetButton").attr("disabled", "disabled");
    
    var nbSamples = 5000,
        duration = 15000;
    
    var url = "https://data.nasa.gov/resource/gh4g-9sfh?$$app_token=72oVQmkbQFVrtrviW6DT8oAvm&$limit=" + nbSamples + "&$where=reclat IS NOT NULL AND year IS NOT NULL and mass > 1&$order=year ASC";
    
    radiusScale = d3.scale.log().domain([1,100000000]).range([0,1]);
    
    var nbImpacts = 0,
        count = 0;
    
    d3.json(url, function (data) {
    
        svg = d3.select("#visual").append("g")
                .attr("id", "plot");
        
        sizeChange(); // Call sizeChange to scale plot

        svg.selectAll("circle")
            .data(data).enter()
            .append("circle")
            .attr("class", "impacts")
            .filter(function (d) {
                lat = parseFloat(d.reclat);
                long = parseFloat(d.reclong);
                loc = lat + long;
                if(loc != 0 && lat > -53) { // Exclude Antartica
                    nbImpacts++;
                    return loc;
                }
            })
            .attr("cx", function (d) {
                return projection([d.reclong, d.reclat])[0];
            })
            .attr("cy", function (d) {
                return projection([d.reclong, d.reclat])[1];
            })
            .attr("r", "0em")
            .transition()
            .attr("r", function(d) {
                return "" + radiusScale(d.mass) + "em";
            })
            .duration(500)
            .delay(function (d,i) {
                return i / nbImpacts * duration;
            })
            .each("end", function(d) {
                count++;
                year = parseInt(d.year.split("-")[0]);
                updateTimeline(year, count, nbImpacts);
                updateCounter(count);
                // Enable reset button if last impact
                if(count == nbImpacts) {
                    d3.select("#resetButton").attr("disabled", null);
                }
            })
            .transition()
            .attr("r", "0.15em")
            .duration(3000);
    });
}

function resetAnimation() {
    // Remove previous plot
    d3.select("#plot").remove();
    
    // Reset timeline and counter
    updateTimeline(0, 0, 100);
    updateCounter(0);
    
    // Enable play button
    d3.select("#playButton").attr("disabled", null);
}

function updateTimeline(year, count, nbImpacts) {
    var value = d3.round(count / nbImpacts * 100, 0);
    d3.select("#timeline .progress-value")
        .text("Year " + year);
    d3.select("#timeline div")
        .attr("aria-valuenow", String(value))
        .style({"width": value+"%"});
}

function updateCounter(count) {
    d3.select("#counter .label-danger").text(count + "  ")
        .append("span").attr("class", "glyphicon glyphicon-pushpin");
}