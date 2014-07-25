var forAllPackages = require('./lib/for_all_packages');
var packageUtils = require("./lib/package_utils");

var i = 0;

var exclude=[];

function addRow(package, doc, data) {

  if (exclude.indexOf(package) === -1) {

    try {

      // find latest version
      var latest_version = packageUtils.findLatestVersion(doc);

      // find maintainers
      var maintainers = packageUtils.findMaintainers(doc);

      // find version numbers
      var num_versions = packageUtils.findNumberOfVersions(doc);

      // get semver breakdown.
      var versem = packageUtils.getSemver(latest_version);

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
        num_versions
      ];

      i++;

      if (i % 500 === 0) {
        console.log("Wrote " + i + " rows");
      }

      return row;
    } catch(e) {
      console.log(package, e);
      exclude.push(package);
    }
  }
}

forAllPackages(addRow, "packages_meta.csv", [
  ["id", "latest_version", "version_major", "version_minor", "version_patch",
  "created", "modified", "maintainer_count", "version_count"]
]);