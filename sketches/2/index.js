// get datafiles

var reqs = [
  $.ajax('../../analysis/longest_running_projects.json'),
  $.ajax('../../analysis/most_mature_projects.json'),
  $.ajax('../../analysis/most_surprisingly_valuable.json'),
  $.ajax('../../analysis/most_used_projects.json'),
  $.ajax('../../analysis/most_versions.json')
];

var data;
var bus = $('<div>');
var container, svg;
var height, width;

$.when.apply($, reqs).then(function() {
  data = {
    longest_running : arguments[0][0],
    most_mature : arguments[1][0],
    most_valuable : arguments[2][0],
    most_used : arguments[3][0],
    most_versions : arguments[4][0],
  };

  container = d3.select('#container');
  height = 800;
  width = 800;

  bus.on('newdata', onData);

  switchData('most_valuable');

});

function onData(ev, data) {
  svg = container.append('svg')
    .attr('height', height)
    .attr('width', width);

  var dim = {
    gridSize : Math.ceil(Math.sqrt(data.length)),
    boxDim: width / Math.ceil(Math.sqrt(data.length)),

    circles: {
      min: 5,
      max: 25
    },

    version: {
      size: 26,
      barwidth: 6
    }
  };

  var scale = d3.scale.linear()
    .domain([0,1])
    .range([dim.circles.min, dim.circles.max]);
  var rscale = d3.scale.sqrt()
    .domain([0,1])
    .range([dim.circles.min, dim.circles.max]);

  // degrees to radians scale.
  var deg2rad = d3.scale.linear().domain([0,360]).range([0, 2*Math.PI]);

  var binding = svg.selectAll('g')
    .data(data, function(d) { return d.package; });

  var entering = binding.enter();
  var exiting = binding.exit();

  // make a container for the circles
  var groups = entering
    .append('g')
    .classed('package', true)
    .attr('width', dim.gridSize)
    .attr('height', dim.gridSize)
    .attr('transform', function(d, i) {
      return 'translate('+
        (Math.floor(i % dim.gridSize) * dim.boxDim)  + ',' +
        (Math.floor(i / dim.gridSize) * dim.boxDim )+')';
    });

  groups.append('rect')
    .attr({
      x: 0, y: 0, width: dim.boxDim, height: dim.boxDim, fill: "none" //, stroke: "blue", "stroke-width": "1px"
    });

  // make a circle for each package
  var circles = groups
    .append('circle')
    .classed('package-circle-main', true)
    .attr('cx', dim.boxDim/2)
    .attr('cy', dim.boxDim/2)
    .attr('r', function(d) {
      return rscale(d.age_quantiles);
    });


  // make a group for the bars, based on where the version is
  var barContainers = groups.append('g')
    .attr('transform', function(d, i) {

      // top left
      var circle_r = rscale(d.age_quantiles);
      var offset = Math.ceil((dim.circles.max - circle_r) / 1.5);

      if (d.version_major === 0) {

        return "translate("+(5 + offset)+", "+(5+ offset)+") rotate(-45, 13, 13)";
      } else if (d.version_major === 1) {

        // bottom left
        return "translate(" +(5+offset)+ ", "+ (dim.boxDim - dim.version.size - 5 - offset) +") rotate(225, 13, 13)";
      } else {

        // bottom right
        return "translate("+(dim.boxDim - dim.version.size - 5 - offset)+","+(dim.boxDim - dim.version.size - 5 - offset)+") rotate(135, 13, 13)";
      }
    });

  // DEBUG border box
  // barContainers.append("rect")
  //   .attr("x", 0)
  //   .attr("y", 0)
  //   .attr("width", function(d) { return dim.version.size; })
  //   .attr("height", function(d) { return dim.version.size; })
  //   .attr("fill", "none")
  //   .attr("stroke", "black")
  //   .attr("stroke-width", 1);


  // time since modified
  barContainers.append("rect")
    .attr({
      x: dim.version.size / 2 - 12.5, y: dim.version.size - 5, width: 5, height: 5
    })
    .attr('y', function(d, i) {
      return dim.version.size - scale(d.deltaSinceModified_quantiles);
    })
    .attr('height', function(d, i) {
      return scale(d.deltaSinceModified_quantiles);
    })
    //.attr('transform', 'rotate(-20, '+ (dim.version.size / 2 - 10) +',' + (dim.version.size - 5) +')')
    .attr('fill', '#B3E681');

  // version count quantiles
  barContainers.append("rect")
    .attr({
      x: dim.version.size / 2 - 5, y: dim.version.size - 5, width: 5, height: 5
    })
    .attr('y', function(d, i) {
      return dim.version.size - scale(d.version_count_quantiles);
    })
    .attr('height', function(d, i) {
      return scale(d.version_count_quantiles);
    })
    //.attr('transform', 'rotate(-10,'+(dim.version.size / 2 - 2.5)+','+(dim.version.size - 5)+')')
    .attr('fill', '#97BFE8');


  barContainers.append("rect")
    .attr({
      x: dim.version.size / 2 + 2.5, y: dim.version.size - 5, width: 5, height: 5
    })
    .attr('y', function(d, i) {
      return dim.version.size - scale(d.deep_dependent_count_p);
    })
    .attr('height', function(d, i) {
      return scale(d.deep_dependent_count_p);
    })
    //.attr('transform', 'rotate(10,'+(dim.version.size / 2 + 5)+','+(dim.version.size - 5)+')')
    .attr('fill', '#EDC27B');

  barContainers.append("rect")
    .attr({
      x: dim.version.size / 2 + 10, y: dim.version.size - 5, width: 5, height: 5
    })
    .attr('y', function(d, i) {
      return dim.version.size - scale(d.direct_dependents_count_p);
    })
    .attr('height', function(d, i) {
      return scale(d.direct_dependents_count_p);
    })
    //.attr('transform', 'rotate(20,'+(dim.version.size / 2 + 12.5)+','+(dim.version.size - 5)+')')
    .attr('fill', '#9C722F');


}

function switchData(name) {
  console.log(data);
  var d = data[name].slice(0,50);
  if (d) {
    bus.trigger('newdata', [d]);
  }
}






