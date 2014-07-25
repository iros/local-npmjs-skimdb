var forAllPackages = require('./lib/for_all_packages');
var packageUtils = require("./lib/package_utils");

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

          var dependencies = doc.versions[latest_version][type];
          if (dependencies) {

            var ds = [];
            var count = 0;

            Object.keys(dependencies).forEach(function(dependency) {
              ds.push(dependency);
              count++;
            });

            if (deps[doc._id]) {
              deps[doc._id][0] += count;
              deps[doc._id][1] = ds;
              // leave [2] alone, we already added dependants to it.

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

  function computeTransientDependents(pkg, sum, visited) {
    if (pkg[2].length === 0) {
      return sum;
    } else {

      for(var i = 0; i < pkg[2].length; i++) {
        sum += pkg[2].length;
        if (visited.indexOf(pkg[2][i]) === -1) {
          visited.push(pkg[2][i]);
          return computeTransientDependents(deps[pkg[2][i]], sum, visited);
        } else {
          return 1;
        }
      }
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
          deps[pkg].push(computeTransientDependents(deps[pkg], 0, []));
        }
      });

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