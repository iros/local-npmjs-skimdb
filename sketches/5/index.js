// get datafiles
var reqs = [
  $.ajax('../../analysis/stats.json')
];

var width, height, data, container, svg, scale, gridx, gridy, dims, r;
var bus = $('<div>');

// these are just offsets + num in each bucket
function _buildBreakdown(data, cats, names) {
  var breakdowns = [];

  for (var i = 0; i < cats.length; i++) {
    var row = [];
    var cat = cats[i];

    // bottom threshold amounts
    var sum = 0;
    for (var j = i-1; j >= 0; j--) {
      sum += data.questions.dimensions[cats[j]];
    }
    row.push(sum);

    // actual values
    row.push(data.questions.dimensions[cat]);

    // names
    row.push(names[i]);

    breakdowns.push(row);
  }

  breakdowns.categories = cats;
  breakdowns.names = names;

  return breakdowns;
}

// By version
function buildVersionBreakdowns(data) {
  var cats = ["zero", "one", "gt_one"];
  var names = ["0.*", "1.*", ">1.*"];

  return _buildBreakdown(data, cats, names);
}

// By age
function buildAgeBreakdowns(data) {
  var cats = ['age_0.25_year', 'age_0.5_year', 'age_1_year', 'age_2_year', 'age_3_year'];
  var names = ["< 3M", "3-6M", "6M-1Y", "1-2Y", "> 2Y"];

  return _buildBreakdown(data, cats, names);
}

$.when.apply($, reqs).then(function() {
  data = arguments[0];

  container = d3.select('#container');

  height = 740;
  width = 1000;
  points_per_dot = 50;

  svg = container.append('svg')
    .attr({
      width: width, height: height
    });

  var breakdowns = buildVersionBreakdowns(data);

  // compute widths
  scale = d3.scale.linear()
    .domain([0, data.total])
    .range([0, width - 200]);

  gridx = 0, gridy = 0;
  for (var i = 0; i < breakdowns.length; i++) {
    var d = breakdowns[i];
    var w = scale(d[1]);

    var grid = Utils.computeGrid(w, height, d[1] / points_per_dot);
    if (grid.gridx > gridx) { gridx = grid.gridx; dims = grid;}
    if (grid.gridy > gridy) { gridy = grid.gridy; dims = grid; }
  }

  r = Math.min(dims.gridx, dims.gridy) / 2 ;

  drawInitialCircles(breakdowns);
  enableMenu();
});

function enableMenu() {
  $('#menu').on('click', 'li', function(ev) {
    bus.trigger('question-selected', $(ev.target).attr('id'));
  });
}

function drawInitialCircles(breakdowns) {
  var padding = 40;

  var databinding = svg.selectAll('g')
    .data(breakdowns, function(d) { return d[1]; });

  var entering = databinding.enter();
  var exiting = databinding.exit();

  var groups = entering.append('g')
    .classed('breakdown', true)
    .attr('transform', function(d, i) {
      return 'translate(' + ((scale(d[0]) + (i * padding))+ ',0)');
    });

  groups.each(function(d, idx) {
    var selection = d3.select(this);
    var category = breakdowns.categories[idx];

    // group width
    var w = scale(d[1]);

    // create label
    var textGroup = selection.append('g').classed('labels', true);

    textGroup.append('text')
      .attr({ x: 0, y : 20})
      .text(d[2]);

    var jj = 0;
    textGroup.append('rect')
      .attr({ x : function(d, i) {
        jj++;
        return w + 10 + (jj * 3);
      }, y : 30, width : 20, height: height})
      .attr('fill', '#eee');

    textGroup.append('text')
      .classed('selected-percentage', true)
      .attr({ x: function(d, i) {
        jj++;
        return w + 10 + (jj * 3);
      }, y : 30 - 5})
      .attr('transform', function(d) { return 'rotate(90,' + (w + 12) + ',30)'; });

    textGroup.append('text')
      .classed('selected-total', true)
      .attr({ x: function(d, i) {
        jj++;
        return w + 10 + (jj * 3);
      }, y : 100 - 5})
      .attr('transform', function(d) { return 'rotate(90,' + (w + 12) + ',100)'; });



    // create circles
    var circleGroup = selection.append('g')
      .classed('circles', true)
      .attr('transform', 'translate(0, 30)');

    var dots = Math.floor(d[1] / points_per_dot);
    var grid = Utils.computeGridUnitSize(w, height, r * 2);

    for(var j = 0; j < dots; j++) {
      circleGroup.append('circle')
        .classed('package-group', true)
        .attr('r', r)
        .attr('cx', function() {
          return ((j % grid.cols) * dims.gridx) + r;
        })
        .attr('cy', function() {
          return (Math.floor(j / grid.cols) * dims.gridy) + r;
        });
    }

    bus.on('question-selected', function(ev, question) {
      var counts = Math.round(data.questions[category][question] / points_per_dot);

      var textLabelPer = textGroup.selectAll('text.selected-percentage');
      var textLabelTot = textGroup.selectAll('text.selected-total');

      textLabelPer.text(
        Math.round((data.questions[category][question]/breakdowns[idx][1]) * 100) + "%"
      );

      textLabelTot.text(
        d3.format(",0")(data.questions[category][question])
      );


      // reset all circles
      circleGroup.selectAll('circle.selected')
        .classed('selected', false);

      // now select that number of circles
      var circles = circleGroup.selectAll('circle');
      circles.each(function(d, m) {
        if (m < counts) {
          d3.select(this).classed('selected', true);
        }
      });

    });
  });
}




