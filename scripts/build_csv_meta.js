var fs = require('fs');
var csv = require('fast-csv');
var _ = require('lodash');
var semver = require('semver-utils');

var meta_rows = [
  ["id", "latest_version", "version_major", "version_minor", "version_patch",
  "created", "modified", "maintainer_count", "version_count"]
], doc, i = 0;

var exclude=[];

function addRow(package) {
  console.log(package);

  if (exclude.indexOf(package) === -1) {

    try {
      var data = fs.readFileSync('data/packages/' + package);

      doc = JSON.parse(data).doc;

      // find latest version
      var latest_version, clearversions ;
      if (doc["dist-tags"]) {
        latest_version = doc["dist-tags"].latest;
      } else {
        if (doc.time) {
          clearversions = _.remove(Object.keys(doc.time), function(x) {
            return !(x === 'created' || x === 'modified' || x === 'unpublished');
          });
          latest_version = clearversions[0];
        }
      }

      // find maintainers
      var maintainers = [];
      if (doc.maintainers) {
        maintainers = doc.maintainers;
      } else if (doc.time && doc.time.unpublished && doc.time.unpublished.maintainers) {
        maintainers = doc.time.unpublished.maintainers;
      } else {
        maintainers = [];
      }

      // find version numbers
      var num_versions;
      if (doc.versions) {
        num_versions = Object.keys(doc.versions).length;
      } else {
        if (clearversions.length) {
          num_versions = clearversions.length;
        }
      }

      var versem;
      if (latest_version) {
        versem = semver.parse(latest_version);
      } else {
        versem = { major : '', minor: '', patch: ''};
      }

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
      meta_rows.push(row);

      if (i % 500 === 0) {
        console.log("Wrote " + i + " rows");
      }
    } catch(e) {
      exclude.push(package);
    }
  }
}

fs.readdir('data/packages', function(err, files) {
  files.splice(files.indexOf(".gitkeep"), 1);

  files.forEach(function(f, idx) {
    addRow(f);
  });

  console.log("writing file");
  console.log("exclude files", exclude);
  csv.writeToPath("data/packages_meta.csv", meta_rows, {headers: true})
    .on('finish', function() {
      console.log("done");
    });
});