var fs = require('fs');
var csv = require('fast-csv');
var _ = require('lodash');
var semver = require('semver-utils');

var meta_rows = [
  ["id", "version", "version_major", "version_minor", "version_patch", "timestamp"]
], doc, i = 0;

var exclude=[];

function addRow(package) {
  console.log(package);

  if (exclude.indexOf(package) === -1) {

    try {
      var data = fs.readFileSync('data/packages/' + package);

      doc = JSON.parse(data).doc;

      if (doc.versions) {

        var versions = Object.keys(doc.versions);
        versions.forEach(function(version) {

          var versem = semver.parse(version);

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
          meta_rows.push(row);
        });

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
  csv.writeToPath("data/packages_versions.csv", meta_rows, {headers: true})
    .on('finish', function() {
      console.log("done");
    });
});