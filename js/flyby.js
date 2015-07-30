d3.select(window).on("resize", sizeChange);

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    duration = 3000;

/* Powers */

var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹",
    formatPower = function(d) { return (d + "").split("").map(function(c) { return superscript[c]; }).join(""); },
    formatTick = function(d) { return 10 + formatPower(Math.round(Math.log(d) / Math.LN10)); };

/* Setup X-axis */

var xValue = function(d) { return d["Mass (kg)"]; },
    xScale = d3.scale.log().range([0, width]),
    xMap = function(d) { return xScale(xValue(d)); },
    xAxis = d3.svg.axis().scale(xScale).orient("bottom")
        .tickPadding(6).innerTickSize(8).ticks(1, formatTick);

/* Setup Y-axis */

var yValue = function(d) { return d["Relative speed (m/s)"]; },
    yScale = d3.scale.linear().range([height, 0]),
    yMap = function(d) { return yScale(yValue(d)); },
    yAxis = d3.svg.axis().scale(yScale).orient("left")
        .tickPadding(6).innerTickSize(8);

/* Setup diameter */

var dValue = function(d) { return d["Diameter (km)"]; },
    dScale = d3.scale.log().range([0.2, 1]),
    diameter = function(d) { return dScale(d); };

/* Setup fill color */
var cValue = function(d) { return d["Impact (GT TNT)"]; },
    cScale = d3.scale.log().range([50, 0]), // Hue scale
    color = function(d) { return "hsl(" + cScale(d) + ", 100%, 50%)"; };

/* Create canvas */
var svg = d3.select("#visual-container").append("svg").attr("id", "plot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g").attr("id", "canvas")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

/* Create tooltip */
var tooltip = d3.select("#visual-container").append("div")
    .attr("class", "tooltip")
    .attr("display", "none")
    .style("opacity", 0);

/* Load data */

d3.csv("data/close-approaches.csv", function(error, data) {
    if (error) return console.error(error);
    
    // Strings to Numbers
    data.forEach(function (d) {
        d["Mass (kg)"] = +d["Mass (kg)"];
        d["Relative speed (m/s)"] = +d["Relative speed (m/s)"];
        d["Impact (GT TNT)"] = +d["Impact (GT TNT)"];
        d["Diameter (km)"] = +d["Diameter (km)"];
        d["CA date"] = parseDate(d["CA date"]);
    });
    
    // Sort by impact
    data.sort(function(a,b) {
        if(a["Impact (GT TNT)"] > b["Impact (GT TNT)"])
            return 1;
        if(a["Impact (GT TNT)"] > b["Impact (GT TNT)"])
            return -1;
        return 0;
    });
    
    // Don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
    yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);
    
    dScale.domain([d3.min(data, dValue), d3.max(data, dValue)]);
    cScale.domain([d3.min(data, cValue), d3.max(data, cValue)]);
    
    // X-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Mass (kg)");

    // Y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Relative speed (m/s)");
    
    // draw dots
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", "0em")
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return color(cValue(d)); })
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d["Object"] + "<br/> " + d["CA date"] + "<br/> (" + xValue(d).toPrecision(2) + ", " + yValue(d) + ")")
                .style("left", (d3.event.pageX - 50) + "px")
                .style("top", (d3.event.pageY - 50) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .attr("display", "none")
                .style("opacity", 0);
        })
        .transition()
        .duration(3000)
        .attr("r", function(d) {
            return diameter(dValue(d)) + "em";
        })
        .delay(function(d, i) {
            return i / data.length * duration;
        });
});

/* Functions */

function sizeChange() {
	    d3.selectAll("#canvas").attr("transform", "scale(" + $("#visual-container").width()/1030 + ") translate(40 50)");
	    $("svg").height($("#visual-container").width()*0.618);
}

function parseDate(s) {
    a = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    m = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    s = s.split("-");
    d = m[a.indexOf(s[1])] + " " + s[2] + ", " + s[0];
    return d;
}