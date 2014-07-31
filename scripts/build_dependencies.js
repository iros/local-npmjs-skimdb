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

          // build dependency object
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

          if (typeof deps[doc._id] === "undefined") {

            // add an entry even though there are no dependencies so that when
            // something else depends on it, we will have the count.
            deps[doc._id] = {
              dependents : [], dependents_count : 0
            };
          }

          if (dependencies) {


            // dependencies of this package
            var ds = Object.keys(dependencies);

            // for every dependency, go and add this package as a dependent.
            ds.forEach(function(dep) {
              if (deps[dep]) {
                if (deps[dep].dependents.indexOf(doc._id) == -1) {
                  deps[dep].dependents.push(doc._id);
                  deps[dep].dependents_count += 1;
                }
                // deps[dep][2].push(doc._id);
              } else {
                deps[dep] = {
                  dependents : [doc._id],
                  dependents_count : 1
                };
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

  var visited_dict = {}, d, ds;

  function computeTransitiveDependents(original_name, name, queued) {
    var row = deps[name];

    if (row.dependents_count === 0) {
      // console.log(original_name, name, "no deps, caching w zero");
      visited_dict[name] = [0, {}];
      return;
    } else {
      for(i = 0; i < row.dependents_count; i++) {
        d = row.dependents[i];
        if (typeof queued[d] === "undefined") {
          queued[d] = 0;
        }
      }

      ds = Object.keys(queued);
      for(i = 0; i < ds.length; i++) {
        d = ds[i];
        if (queued[d] === 0) {
          queued[d] = 1;

          // if we've cached it before, just copy over the visited queue
          // so we don't visit the same nodes again.
          if (typeof visited_dict[d] !== "undefined") {
            // console.log(original_name, "cache hit", d);
            queued = _.extend(queued, visited_dict[d][1]);
          } else {
            // console.log(original_name, "traversing", d);
            computeTransitiveDependents(original_name, d, queued);
          }

        }
      }

      // if we are back to where we started...
      if (original_name == name) {
        var keys = Object.keys(queued);
        var n = keys.length;
        if (keys.indexOf(original_name) !== -1) {
          n -= 1;
        }
        // cache count & visited queue, so we can just copy it over.
        visited_dict[original_name] = [n, queued];
        row.deep_dependent_count = n;
      }
    }
  }

  function transform(deps) {
    return function() {

      var rows = [];

      //console.log(deps);
      // now that dependencies are computed, we need to compute the indirect
      // dependencies.
      Object.keys(deps).forEach(function(pkg) {
        if (deps[pkg].dependents_count === 0) {

          // nothing depends on this, so, nothing to do here.
          deps[pkg].deep_dependent_count = 0;
        } else {
          computeTransitiveDependents(pkg, pkg, {});
        }
      });

      // convert deps to csv
      Object.keys(deps).forEach(function(pkg) {
        rows.push([
          pkg, deps[pkg].dependents_count, deps[pkg].deep_dependent_count
        ]);
      });

      return rows;
    };
  }

  forAllPackages(computeDependencies, "packages_" + type + ".csv", [
    ["package", "direct_dependents", "deep_dependents"]
  ], transform(deps));

}

makeFiles("dependencies");
makeFiles("devDependencies");
// a combination of dev dependencies, and regular dependencies (the set of the union.)
makeFiles("both");