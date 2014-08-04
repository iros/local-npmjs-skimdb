// get datafiles
var reqs = [
  $.ajax('../../analysis/longest_running_projects.json'),
  $.ajax('../../analysis/most_mature_projects.json'),
  $.ajax('../../analysis/most_surprisingly_valuable.json'),
  $.ajax('../../analysis/most_used_projects.json'),
  $.ajax('../../analysis/most_versions.json')
];

var data;
var subset;
var bus = $('<div>');
var container, svg;
var height, width;
var template, details, legend;
var gridColors = d3.scale.category10();
var deg2rad = d3.scale.linear().domain([0,360]).range([0, 2*Math.PI]);
var properties = ['age_quantiles', 'version_count_quantiles',
  'deltaSinceModified_quantiles', 'deep_dependent_count_p',
  'direct_dependents_count_p'];
var scale;
var dim;

$.when.apply($, reqs).then(function() {
  data = {
    longest_running : arguments[0][0],
    most_mature : arguments[1][0],
    most_valuable : arguments[2][0],
    most_used : arguments[3][0],
    most_versions : arguments[4][0],
  };

  container = d3.select('#container');
  height = 600;
  width = 1000;

  bus.on('newdata', onData);

  $(function() {
    template = _.template($('#package_metadata').text());
    details = $('#details');

    bus.on('package-selected', onPackageSelected);

    bus.on('property-deselected', onPropertyDeselected);
    bus.on('property-selected', onPropertySelected);

    bus.on('property-clicked', onPropertyClick);

    switchData('most_valuable');

    buildLegend(["Age Q", "# of versions", "Days since last modified", "Deep dependents p", "Direct dependents p"], d3.select('#legend'));
  });

});

function onData(ev, data) {
  subset = data;
  svg = container.append('svg')
    .attr('height', height)
    .attr('width', width);

  var dots = data.length;

  var rows = Math.ceil(Math.sqrt( dots * (height / width )));
  var cols = Math.ceil(dots / rows);

  var gridx = Math.floor(width / cols);
  var gridy = Math.floor(height/ rows);

  console.log(rows, cols, rows*cols, gridx, gridy);

  dim = {
    cols: cols,
    rows: rows,
    gridx : gridx,
    gridy : gridy,
    r : { min : 0, max : Math.min(gridx / 2, gridy / 2) - 10}
  };

  var binding = svg.selectAll('g')
    .data(data, function(d) { return d.package; });

  var entering = binding.enter();
  var exiting = binding.exit();

  // make a container for the circles
  var groups = entering
    .append('g')
    .classed('package', true)
    .attr('transform', function(d, i) {
      return 'translate('+((i % cols) * gridx) +','+ (Math.floor(i / cols) * gridy) +')';
    });

  // make a label
  groups.append('text')
    .attr('x', dim.gridx / 2)
    .attr('y', dim.gridy)
    .attr('text-anchor', 'middle')
    .text(function(d, i) { return d.package; });


  // make a circle for each package
  var circles = groups
    .append('circle')
    .classed('package-circle-main', true)
    .attr('cx', dim.gridx / 2)
    .attr('cy', dim.gridy / 2)
    .attr('r', dim.r.max );

  // degrees to radians scale.
  scale = d3.scale.linear().domain([0,1]).range([dim.r.min, dim.r.max]);

  var angles = [];

  for(var i = 0; i < properties.length; i++) {
    angles.push((360 / properties.length) * i);
  }

  var line = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("linear");

  function buildPaths(selection, properties, angles) {
    // draw gridlines
    var grid = selection.append('g')
      .classed('grid', true);

    for(var i = 0; i < properties.length; i++) {
      grid.append('line')
        .attr({
          x1: dim.r.max * Math.cos(deg2rad(angles[i])) + (dim.gridx / 2),
          y1: dim.r.max * Math.sin(deg2rad(angles[i])) + (dim.gridy / 2),
          x2: dim.gridx / 2,
          y2: dim.gridy / 2
        });
    }

    // draw polar chart
    var area = selection.append('path')
      .classed('data', true)
      .attr('d', function(d, i) {
        var points = [];
        for(var i = 0; i < properties.length; i++) {
          var val = scale(d[properties[i]]);
          var x = val * Math.cos(deg2rad(angles[i])) + (dim.gridx / 2);
          var y = val * Math.sin(deg2rad(angles[i])) + (dim.gridy / 2);
          points.push({ x: x, y : y});
        }
        return line(points) + "Z";
      });

    area.on('mouseover', function(d, i) {
      bus.trigger('package-selected', d, i);
    });

    // append grid inside shapes

    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      var angle = angles[i];

      // grid
      selection.append('path')
        .classed('inner-grid', true)
        .classed(properties[i], true)
        .attr('d', function(d, j) {
          var path = "M " + dim.gridx / 2 + " " + dim.gridy / 2; // move to center
          var val = scale(d[property]) - 1;
          console.log(d.package, val);
          var x = val * Math.cos(deg2rad(angle)) + (dim.gridx / 2);
          var y = val * Math.sin(deg2rad(angle)) + (dim.gridy / 2);

          path += "L " + x + " " + y;
          return path;
        })
        .attr('fill', 'none')
        .attr('stroke', "#8E8E8E")
        .attr('stroke-width', '2px');

      // circles
      selection.append('circle')
        .classed('inner-grid', true)
        .classed(properties[i], true)
        .attr('cx', function(d, j) {
          var val = scale(d[property]) - 1;
          var x = val * Math.cos(deg2rad(angle)) + (dim.gridx / 2);
          return x;
        })
        .attr('cy', function(d, j) {
           var val = scale(d[property]) - 1;
           var y = val * Math.sin(deg2rad(angle)) + (dim.gridy / 2);
           return y;
        })
        .attr('r', 3)
        .attr('fill', gridColors(i));
    }

  }

  buildPaths(groups, properties, angles);
}

function buildLegend(properties, legend) {

  var angles = [];
  var r = 20;

  var legendsvg = legend.append('svg')
    .attr({
      width: 400, height: 200
    });

  var binding = legendsvg.selectAll('path')
    .data(properties);

  var entering = binding.enter();

  entering.append('path')
    .attr('d', function(d, i) {
      var angle = (360 / properties.length) * i;
      var path = "M 200 100"; // center
      var x = r * Math.cos(deg2rad(angle)) + 200; // half of width
      var y = r * Math.sin(deg2rad(angle)) + 100; // half of height
      path += "L " + x + " " + y;
      return path;
    })
    .attr('fill', 'none')
    .attr('stroke', function(d, i) { return gridColors(i); })
    .attr('stroke-width', '3px');

  var labels = entering.append('text')
    .attr('x', function(d, i) {
      var angle = (360 / properties.length) * i;
      var x = r * Math.cos(deg2rad(angle)) + 200; // half of width
      return x;
    })
    .attr('y', function(d, i) {
      var angle = (360 / properties.length) * i;
      var y = r * Math.sin(deg2rad(angle)) + 100; // half of height
      if (angle > 0 && angle < 180) { y += 10; }
      if (angle == 0) { y += 5; }
      return y;
    })
    .attr('text-anchor', function(d, i) {
      var angle = (360 / properties.length) * i;
      if (angle < 90) {
        return 'start';
      } else if (angle > 90 && angle < 270) {
        return 'end';
      }
    })
    .attr('fill', function(d, i) { return gridColors(i); })
    .text(function(d) { return d; });

  labels.on('mouseover', function(d, i) {
    bus.trigger('property-selected', [d, i]);
  });

  labels.on('mouseout', function(d, i) {
    bus.trigger('property-deselected', [d, i]);
  });

  labels.on('click', function(d, i) {
    bus.trigger('property-clicked', [d, i]);
  });
}

function onPropertySelected(ev, property, i) {
  var prop = properties[i]; // get dev name
  var groups = svg.selectAll('g.package');

  // append opaque rect
  groups.append('rect')
    .classed('opacbox', true)
    .attr({
      x : 0,
      y : 0,
      width: dim.gridx,
      height: dim.gridy - 10
    })
    .attr('fill', 'white')
    .attr('fill-opacity', 0.75);

  // append line
  groups.append('line')
    .classed('selected-property-line', true)
    .attr('x1', function(d, j) {
      var angle = (360 / properties.length) * i;
      var r = scale(d[prop]);
      var x = r * Math.cos(deg2rad(angle)) + dim.gridx / 2; // half of width
      return x;
    })
    .attr('y1', function(d, j) {
      var angle = (360 / properties.length) * i;
      var r = scale(d[prop]);
      var y = r * Math.sin(deg2rad(angle)) + dim.gridy / 2; // half of height
      return y;
    })
    .attr('x2', dim.gridx / 2)
    .attr('y2',  dim.gridy / 2)
    .attr('stroke', gridColors(i))
    .attr('stroke-width', '3px');
}

function onPropertyDeselected(ev, d, i) {
  svg.selectAll('.opacbox').remove();
  svg.selectAll('.selected-property-line').remove();
}

function onPropertyClick(ev, d, i) {
  var property = properties[i];
  subset = _.sortBy(subset, function(row) {
    return -row[property];
  });

  var groups = svg.selectAll('g.package');
  var databinding = groups.data(subset, function(d) { return d.package; });

  var entering = databinding.enter();
  var exiting = databinding.exit();
  console.log(entering, databinding, exiting);

  databinding.transition().delay(function(d, i) { return i * 10; }).attr('transform', function(d, i) {
    return 'translate('+((i % dim.cols) * dim.gridx) +','+ (Math.floor(i / dim.cols) * dim.gridy) +')';
  });
}

function onPackageSelected(ev, package, idx) {
  details.html(template(package));
}

function switchData(name) {

  var d = data[name].slice(0,80);
  if (d) {
    bus.trigger('newdata', [d]);
  }
}






