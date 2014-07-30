var forAllPackages = require('./lib/for_all_packages');
var packageUtils = require("./lib/package_utils");
var _ = require('lodash');

function makeFiles(type) {

  var i = 0;

  var exclude=[];
  var deps = {};

  function computeDependencies(package, doc) {

    if (exclude.indexOf(package) === -1) {

      try {

        // find latest version
        var latest_version = packageUtils.findLatestVersion(doc);

        if (doc.versions && doc.versions[latest_version]) {

          var dependencies;
          if (type !== "both") {
            dependencies = doc.versions[latest_version][type];
          } else {
            // create a merged list of both. we don't care about overwriting
            // some, since we just want a unique set of keys.
            dependencies = _.extend({},
              doc.versions[latest_version].dependencies,
              doc.versions[latest_version].devDependencies);
          }

          if (dependencies) {

            // dependencies of this package
            var ds = [];
            var count = 0;

            Object.keys(dependencies).forEach(function(dependency) {
              ds.push(dependency);
              count++;
            });

            if (deps[doc._id]) {

              // add number of dependencies this package has
              deps[doc._id][0] += count;

              // add this dependency to its array of dependencies.
              deps[doc._id][1] = ds;

            } else {
              deps[doc._id] = [count, ds, []];
            }

            // for every dependency, go and add this package as a dependent.
            ds.forEach(function(dep) {
              if (deps[dep]) {
                deps[dep][2].push(doc._id);
              } else {
                deps[dep] = [0, [], [doc._id]];
              }
            });
          } else {

            // add an entry even though there are no dependencies.
            deps[doc._id] = [0, [], []];
          }
        }

        i++;

        if (i % 500 === 0) {
          console.log("Processed " + i + " rows");
        }
      } catch(e) {
        console.log(package, e);
        exclude.push(package);
      }
    }
  }

  var visited_dict = {};


  function computeTransientDependents2(name, pkg, visited) {
    if (typeof pkg === "undefined" || typeof pkg[2] === "undefined" || pkg[2].length === 0) {
      return 0;
    } else {

      // start off with length of deps.
      //
      // sum should be those packages, that are not already in visited
      var sum = 0;

      // for (var j = 0; j < pkg[2].length; j++) {
      //   if (visited.indexOf(pkg[2]) === -1) {
      //     sum += 1;
      //   }
      // }
      // var sum = pkg[2].length;

      visited.push(name); // you auto visit yourself!

      // visit each dependency, and aggregate its length of dependencies.
      for (var i = 0; i < pkg[2].length; i++) {
        var dependency = pkg[2][i];

        // only visit unvisited dependencies.
        if (visited.indexOf(dependency) === -1) {

          visited.push(dependency);

          // do we already have a cached version of this? if so, use it.
          if (typeof visited_dict[dependency] !== "undefined") {
            sum = sum + 1 + visited_dict[dependency][1];
            // visited.push(dependency);

          // else, traverse down.
          } else {
            var dep_pkg = deps[dependency];
            // visited.push(dependency);
            sum = sum + 1 + computeTransientDependents(dependency, deps[dependency], visited);
          }
        }
      }

      // cache the result
      console.log(name, visited);
      visited_dict[name] = [visited, sum];
      return sum;
    }
  }


  function transform(deps) {
    return function() {

      var rows = [];

      // now that dependencies are computed, we need to compute the indirect
      // dependencies.
      Object.keys(deps).forEach(function(pkg) {
        if (deps[pkg][2].length === 0) {
          // nothing depends on this, so, nothing to do here.
          deps[pkg].push(0);
        } else {
          deps[pkg].push(computeTransientDependents(pkg, deps[pkg], []));
        }
      });

      console.log(visited_dict);

      // convert deps to csv
      Object.keys(deps).forEach(function(pkg) {
        rows.push([
          pkg, deps[pkg][0], deps[pkg][1], deps[pkg][2], deps[pkg][2].length, deps[pkg][3]
        ]);
      });

      return rows;
    };
  }

  forAllPackages(computeDependencies, "packages_" + type + ".csv", [
    ["package", "depends_on_count", "dependencies", "direct_dependents", "direct_dependents_count", "deep_dependent_count"]
  ], transform(deps));

}

makeFiles("dependencies");
makeFiles("devDependencies");
// a combination of dev dependencies, and regular dependencies (the set of the union.)
makeFiles("both");