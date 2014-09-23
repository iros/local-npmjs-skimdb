var dims = {
  versions : {
    zero : { width: 100, height: 100, offset: 0 },
    one  : { width: 200, height: 100, offset: 200 },
    three: { width: 120, height: 100, offset: 500 }
  },
  age : {
    young: { width: 300, height: 100, offset: 0 },
    old: { width: 300, height: 100, offset: 400 }
  }
};

var data = [
  {i:1,  versions_idx: 0, versions : "zero",  age_idx: 0, age:"old"},
  {i:2,  versions_idx: 1, versions : "zero",  age_idx: 0, age:"young" },
  {i:3,  versions_idx: 2, versions : "zero",  age_idx: 1, age:"young"},
  {i:4,  versions_idx: 3, versions : "zero",  age_idx: 2, age:"young"},
  {i:5,  versions_idx: 4, versions : "zero",  age_idx: 3, age:"young"},
  {i:6,  versions_idx: 0, versions : "one",   age_idx: 4, age:"young"},
  {i:7,  versions_idx: 1, versions : "one",   age_idx: 5, age:"young"},
  {i:8,  versions_idx: 2, versions : "one",   age_idx: 1, age:"old"},
  {i:9,  versions_idx: 3, versions : "one",   age_idx: 2, age:"old"},
  {i:10, versions_idx: 4, versions : "one",   age_idx: 3, age:"old"},
  {i:11, versions_idx: 0, versions : "three", age_idx: 6, age:"young"},
  {i:12, versions_idx: 1, versions : "three", age_idx: 4, age:"old"},
  {i:13, versions_idx: 2, versions : "three", age_idx: 5, age:"old"}
];


$(function() {

  var r = 5;
  var container = d3.select('#container');
  var svg = container.append("svg")
    .attr({
      width: 800, height: 800
    });

  var breakdown = "age";

  var binding = svg.selectAll('circle')
    .data(data, function(d) { return d.i; });

  var entering = binding.enter();
  var exiting = binding.exit();

  var newcircles = entering.append('circle')
    .attr('r', r)
    .attr('fill', function(d, i) { if (d.age === "old") { return 'grey'} else { return 'blue'; }})
    .attr('idx', function(d) { return d.i; })
    .attr('cx', function(d, i) {
      return r + dims[breakdown][d[breakdown]].offset;
    })
    .attr('cy', function(d, i) { return r * 2 * d[breakdown + "_idx"]; });

  $('#doit').click(function(d) {

    if (breakdown === "age") {breakdown = "versions";}
    else if (breakdown === "versions") breakdown = "age";
    var oldcircles = svg.selectAll('circle')
      .transition()
      .delay(function(d, i) { return i * 10; })
      .attr('cx', function(d, i) {
        return r + dims[breakdown][d[breakdown]].offset;
      })
      .attr('cy', function(d, i) {
        return r * 2 * d[breakdown + "_idx"];
      });

  });
});

