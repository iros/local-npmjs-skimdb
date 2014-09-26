var forAllPackages = require('./lib/for_all_packages');
var packageUtils = require("./lib/package_utils");

var i = 0;

var exclude=[];

function addRow(package, doc, data) {

  if (exclude.indexOf(package) === -1) {

    var latest_version;
    var maintainers;
    var num_versions;
    var versem;
    var keywords;
    var node_version;

    try {

      // find latest version
      latest_version = packageUtils.findLatestVersion(doc);

      // find maintainers
      maintainers = packageUtils.findMaintainers(doc);

      // find version numbers
      num_versions = packageUtils.findNumberOfVersions(doc);

      // get semver breakdown.
      versem = packageUtils.getSemver(latest_version);

      // get keywords
      // keywords = packageUtils.getKeywords(doc, latest_version);

      // get node version
      node_version = packageUtils.findNodeVersion(doc, latest_version);

      // build row
      var row = [
        doc._id,
        latest_version,
        versem.major ,
        versem.minor,
        versem.patch,
        doc.time ? doc.time.created : doc.ctime,
        doc.time ? doc.time.modified : doc.mtime,
        maintainers.length,
        num_versions,
        node_version
      ];

      i++;

      if (i % 500 === 0) {
        console.log("Wrote " + i + " rows");
      }

      return row;
    } catch(e) {
      console.log(package, e, latest_version);
      exclude.push([package, latest_version]);
    }
  }
}

forAllPackages(addRow, "packages_meta.csv", [
  ["id", "latest_version", "version_major", "version_minor", "version_patch",
  "created", "modified", "maintainer_count", "version_count", "node_version"]
], function(rows) {
  // var transformed_rows = [];
  // rows.forEach(function(r) {

  //   // combine keywords so they don't mess up our separation
  //   // r[10] = r[10].toString();
  //   transformed_rows.push(r);
  // });

  // return transformed_rows;
  return rows;
});