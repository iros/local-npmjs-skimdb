var forAllPackages = require('./lib/for_all_packages');
var packageUtils = require("./lib/package_utils");

var i = 0;

var exclude=[];

function addVersionRow(package, doc, data) {

  var rows = [];
  if (exclude.indexOf(package) === -1) {

    try {

      if (doc.versions) {

        var versions = Object.keys(doc.versions);
        versions.forEach(function(version) {

          if (doc.time) {
            // get semver breakdown.
            var versem = packageUtils.getSemver(version);

            if (versem === null) {
              throw new Error("Can't parse " + package + " " + version);
            }

            var row = [
              doc._id,
              version,
              versem.major ,
              versem.minor,
              versem.patch,
              doc.time[version]
            ];

            i++;

            if (i % 500 === 0) {
              console.log("Wrote " + i + " rows");
            }

            rows.push(row);
          }
        });

      }

      return rows;

    } catch(e) {
      console.log(package, e);
      exclude.push(package);
    }
  }
}

forAllPackages(addVersionRow, "packages_versions.csv", [
  ["id", "version", "version_major", "version_minor", "version_patch", "timestamp"]
]);