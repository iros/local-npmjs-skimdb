$(function() {

  var width = 1200, height = 1000;
  var container = d3.select('#container');

  var svg = container.append('svg')
    .attr({
      width: width, height: height
    });

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

    var subset = data['most_used'];
    var dots = subset.length;

    var rows = Math.ceil(Math.sqrt( dots * (height / width )));
    var cols = Math.ceil(dots / rows);

    var gridx = Math.floor(width / cols);
    var gridy = Math.floor(height/ rows);

    console.log(rows, cols, rows*cols, gridx, gridy);

    var binding = svg.selectAll('g')
      .data(subset, function(d, i) { return d.package; });

    var entering = binding.enter();
    var exiting = binding.exit();

    var groups = entering.append('g')
      .classed('package', true);

    function makeMarker(selection) {
      selection.each(function(d, i) {
        var selection = d3.select(this);

        if (d.version_major === 0) {
          selection.append('circle')
            .attr({
              cx: 10, cy : 10, r : 5
            }).attr('fill', '#94D1EB');
        } else if (d.version_major === 1) {
          selection.append('rect')
          .attr({
            x: 10, y : 0, width: 5, height: 15
          }).attr('fill', '#438FB0');
        } else {
          selection.append('path')
            .attr('d', 'M 10 0 L 15 15 L 5 15 z')
            .attr('fill', '#0F3F54');
        }
      });
    }

    groups.append('g')
      .classed('version_marker', true)
      .attr('transform', function(d, i) {
        return 'translate('+((i % cols) * gridx) +','+ (Math.floor(i / cols) * gridy) +')';
      })
      .call(makeMarker);
  });
});