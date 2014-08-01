var container = d3.select('#container');
var details = d3.select('#details');
var legend = d3.select('#legend');

var svg;

var details_template = _.template(d3.select('#details_template').text());

d3.json('subset.json', function(packages) {

  p = packages.slice(0,100);

  var gridSize = Math.sqrt(p.length);
  var width = 800;
  var height = 800;
  svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  var padding = 5;
  var boxDim = (width / (gridSize));


  var dataBinding = svg.selectAll('g')
    .data(p, function(d) {
      return d.package;
    });

  var groups = dataBinding.enter();

  var boxScale = d3.scale.linear()
    .domain([0,1])
    .range([7, boxDim - 12]);

  enterNewRects(p, groups, gridSize, boxDim, padding, boxScale);

  buildLegend(packages, dataBinding, gridSize, boxDim, padding, boxScale);

});

function enterNewRects(packages, enteringDataBinding, gridSize, boxDim, padding, boxScale) {
  var groups = enteringDataBinding.append('g')
    .attr('transform', function(d, i) {
      return 'translate(' +
        (Math.floor(i % gridSize) * boxDim) + ',' +
        (Math.floor(i / gridSize) * boxDim ) + ')';
    });

  // make rect
  var rects = makeRect(groups, gridSize, boxDim, padding);

  makeBars(groups, boxScale, boxDim);

  var selected, selectedPackage;
  groups.selectAll('rect.package')
    .on('mouseover', buildMetadata)
    .on('click', function(d) {
      if (selected) {
        selected.classed('selected', false);
      }
      if (d.package !==  selectedPackage) {
        selected = d3.select(this);
        selected.classed('selected', true);
        selectedPackage = d.package;
      } else {
        selected = null;
        selectedPackage = null;
      }
    });


  // make corner circles
  makeCircleMarkers(groups, boxDim);
}

function buildMetadata(pkg) {
  details.html(details_template(pkg));
}

function buildLegend(packages, groupDataBinding, gridSize, boxDim, padding, boxScale) {
  var dataBinding = legend.selectAll('div')
    .data([
      ['Deep Dependents Count %', 'deep_dependent_count_p', '#CC9235'],
      ['Version Count %', 'version_count_p', '#8FCC66'],
      ['Direct Dependents Count %', 'direct_dependents_count_p', '#8FC4EB'],
      ['Depends on Count %', 'depends_on_count_percent_p', '#E6D453'],
      ['Version', 'version_major', 'grey'],
    ]);

  dataBinding.enter()
    .append('div')
    .style('padding', '5px')
    .style('background-color', function(d, i) { return d[2]; })
    .text(function(d) { return d[0]; })
    .on('click', function(d) {

      var p = _.sortBy(packages, function(pkg) {

        if (d[1] !== "version_major") {
          return -pkg[d[1]]; // sort by whichever property we chose.
        } else {
          if ( pkg.version_major !== null &&
               pkg.version_minor !== null) {
            return -Number(pkg.version_major + "." + pkg.version_minor);
          } else {
            return 10;
          }
        }
      });

      p = p.slice(0,100);



      var b = svg.selectAll('g').data(p, function(k) { return k.package; });

      var pos = _.pluck(p, 'package');

      b.exit().transition().delay(function(d,i) { return i; })
        .attr('transform', 'translate(-50,-50)').remove();

      b.transition().delay(function(d, i) {
        return i * 2;
      }).attr('transform',
        function(d) {
          var i = pos.indexOf(d.package);

          return 'translate(' +
            (Math.floor(i % gridSize) * boxDim) + ',' +
            (Math.floor(i / gridSize) * boxDim ) + ')';
        }
      );

      setTimeout(function() {
        enterNewRects(p,  b.enter(), gridSize, boxDim, padding, boxScale);
      }, 200);

    });
}



function makeBars(groups, boxScale, boxDim) {
  makeDirectDependentCountBars(groups, boxScale, 4, 3);
  makeDependsOnCountBars(groups, boxScale, 3, 4);
  makeVersionCountBars(groups, boxScale, 3, boxDim - 16);
  makeDeepDependentsBars(groups, boxScale, boxDim-16, 4);
  makeVersionCircle(groups, boxDim);
}

function _makeBaseRect(groups, boxScale, x, y) {
  return  groups.append('rect')
    .classed('databar', true)
    .attr('x', x)
    .attr('y', y)
    .attr('fill-opacity', 0.75);
}

function makeDeepDependentsBars(groups, boxScale, x, y) {
  _makeBaseRect(groups, boxScale, x, y)
    .attr('width', 8)
    .attr('height', 0)
    .transition()
    .delay(function(d, i) { return i * 6; })
    .attr('width', 8)
    .attr('height', function(d) { return boxScale(d.deep_dependent_count_p); })
    .attr('fill', '#CC9235');
}

function makeVersionCountBars(groups, boxScale, x, y) {
  _makeBaseRect(groups, boxScale, x, y)
    .attr('width', 0)
    .attr('height', 8)
    .transition()
    .delay(function(d, i) { return i * 6; })
    .attr('height', 8)
    .attr('width', function(d) { return boxScale(d.version_count_p); })
    .attr('fill', '#8FCC66');
}

function makeDirectDependentCountBars(groups, boxScale, x, y) {
  _makeBaseRect(groups, boxScale, x, y)
    .attr('width', 8)
    .attr('height', 0)
    .transition()
    .delay(function(d, i) { return i * 6; })
    .attr('width', 8)
    .attr('height', function(d) { return boxScale(d.direct_dependents_count_p); })
    .attr('fill', '#8FC4EB');
}

function makeDependsOnCountBars(groups, boxScale, x, y) {
  _makeBaseRect(groups, boxScale, x, y)
    .attr('width', 0)
    .attr('height', 8)
    .transition()
    .delay(function(d, i) { return i * 6; })
    .attr('width', function(d) { return boxScale(d.depends_on_count_percent_p); })
    .attr('height', 8)
    .attr('fill', '#E6D453');
}

function makeVersionCircle(groups, boxDim) {
  groups.append('circle')
    .attr('class', function(d) {
      switch (d.version_major) {
        case (0):
          return 'version_major_zero';
        case (1):
          return 'version_major_one';
        default:
          if (d.version_major > 1) {
            return 'version_major_gt_one';
          } else {
            return 'no_version_data';
          }
      }
    })
    .attr('cx', boxDim / 2 - 3)
    .attr('cy', boxDim / 2 - 3)
    .attr('r', 0)
    .transition()
    .attr('r', 6);

}

function makeRect(groups, gridSize, boxDim, padding) {
  return groups.append('rect')
      .classed('package', true)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('fill', '#fff')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', 0)
      .attr('height', 0)
      .transition()
      .delay(function(d,i) { return i * 4; })
      .attr('width', boxDim - padding)
      .attr('height', boxDim - padding);
}


function makeCircleMarkers(groups, boxDim) {
  var r = 2;
  groups.append('circle')
    .attr('cx', 7)
    .attr('cy', 7)
    .attr('r', 0)
    .transition()
    .delay(function(d, i) { return i * 6; })
    .attr('r', r)
    .attr('fill', 'black');

  groups.append('circle')
    .attr('cx', boxDim - 12)
    .attr('cy', boxDim - 12)
    .attr('r', 0)
    .transition()
    .delay(function(d, i) { return i * 6; })
    .attr('r', r)
    .attr('fill', 'black');

  groups.append('circle')
    .attr('cx', 7)
    .attr('cy', boxDim - 12)
    .attr('r', 0)
    .transition()
    .delay(function(d, i) { return i * 6; })
    .attr('r', r)
    .attr('fill', 'black');

  groups.append('circle')
    .attr('cx', boxDim - 12)
    .attr('cy', 7)
    .attr('r', 0)
    .transition()
    .delay(function(d, i) { return i * 6; })
    .attr('r', r)
    .attr('fill', 'black');
}
