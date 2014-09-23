var data = {
  versions: {
    grids : [
      { name : "zero", dots : [{i: 1} , {i: 2} , {i:3} , {i:4} , {i:5} ], dims: { width: 100, height: 100, offset: 0}},
      { name : "one", dots : [{i: 6} , {i: 7} , {i:8} , {i:9} , {i:10} ], dims: { width: 200, height: 100, offset: 200 }},
      { name : "three", dots : [{i: 11} , {i: 12} , {i:13} ], dims: { width: 120, height: 100, offset: 500 }}
    ]
  },

  age: {
    grids: [
      { name : "old", dots: [{i: 2} , {i:3} , {i:4} , {i:5}, {i: 6} , {i: 7} , {i:8}, {i: 11}], dims: { width: 300, height: 100, offset: 0 }},
      { name : "young", dots: [{i: 1} ,{i:9} , {i:10}, {i: 12} , {i:13}], dims: { width: 300, height: 100, offset: 400 }},
    ]
  }
};

$(function() {

  var r = 5;
  var container = d3.select('#container');
  var svg = container.append("svg")
    .attr({
      width: 800, height: 800
    });

  var temp = svg.append('g').classed('temp', true);

  var breakdown = "versions";

  var groupbinding = svg.selectAll('g.gridpart')
    .data(data.versions.grids, function(d) { return d.name; });

  var g_enter = groupbinding.enter();
  var g_exit = groupbinding.exit();

  // ====== NEW STUFF
  // draw new groups
  var newgroups = g_enter.append('g')
    .classed('gridpart', true)
    .attr('transform', function(d) {
      return 'translate('+d.dims.offset+',0)';
    });

  var circlesbinding = newgroups.selectAll('circle')
    .data(function(d) {
      return d.dots;
    }, function(d) { return d.i; });

  var c_enter = circlesbinding.enter();
  var c_exit = circlesbinding.exit();

  c_enter.append('circle')
    .attr('pkg', true)
    .attr('idx', function(d, i) { return d.i; })
    .attr('cx', function(d) {
      return r * 2;
    })
    .attr('cy', function(d,i) {
      return r * 2 * i + r + 3;
    })
    .attr('r', r);


  // ===== GROUPS EXITING
  $('#doit').on('click', function() {

    var newgroupbinding = svg.selectAll('g.gridpart').data(data.age.grids, function(d) { return d.name; });

    var newgroupbinding_exit = newgroupbinding.exit();

    // save old groups
    var elms = newgroupbinding_exit.remove()[0];
    elms.forEach(function(elm) {
      temp.select(function() { return this.appendChild(elm); });
    });
    var oldcircles = temp.selectAll('circle')
      .transition()
      .attr('cx', function(d) {
        return Math.random(0) * 30;
      })
      .attr('cy', function(d) {
        return Math.random(0) * 100;
      });

    var newgroups = newgroupbinding.enter().append('g')
      .classed('gridpart', true)
      .attr('transform', function(d) {
        return 'translate('+d.dims.offset+',0)';
      });

    //  how do I move these damn circles in here!?
    newgroups.select(function(d) {
      var selection = this;
      var oldcircleelms = oldcircles[0];
      for(var i = 0; i < d.dots.length; i++) {
        var c = oldcircleelms[i];
        selection.appendChild(c);
      }
      console.log(oldcircles);
      return selection;
    });

  });
});

