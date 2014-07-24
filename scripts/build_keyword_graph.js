var fs = require('fs');
var csv = require('fast-csv');
var _ = require('lodash');
var semver = require('semver-utils');

var meta_rows = [
  ["target", "source", "count"]
], doc, i = 0;

var exclude=[];
var keywords = {};

function addKeyPairs(package) {
  console.log(package);

  if (exclude.indexOf(package) === -1) {

    try {
      var data = fs.readFileSync('data/packages/' + package);

      doc = JSON.parse(data).doc;

      if (doc["dist-tags"] && doc["dist-tags"].latest) {

        var latest_version_doc = doc.versions[doc["dist-tags"].latest];
        if (latest_version_doc.keywords && latest_version_doc.keywords.length > 1) {

          for (var j = 0; j < latest_version_doc.keywords.length; j++) {
            for (var k = 0; k < latest_version_doc.keywords.length; k++) {

              if (k > j) {
                var target = latest_version_doc.keywords[j];
                var source = latest_version_doc.keywords[k];
                var joinedkey;

                // key should be in alphabetical order
                if (source < target) {
                  joinedkey = source+"::"+target;
                } else {
                  joinedkey = target+"::"+source;
                }

                if (typeof keywords[joinedkey] === "undefined") {
                  keywords[joinedkey] = 1;
                } else {
                  keywords[joinedkey] += 1;
                }
              }
            }
          }
        }

      }

    } catch(e) {
      exclude.push(package);
    }
  }
}

fs.readdir('data/packages', function(err, files) {
  files.splice(files.indexOf(".gitkeep"), 1);

  files.forEach(function(f, idx) {
    addKeyPairs(f);
  });


  console.log("writing file");
  console.log("exclude files", exclude);

  // transform keys
  Object.keys(keywords).forEach(function(joinkey) {
    var st = joinkey.split("::");
    meta_rows.push([
        st[0],
        st[1],
        keywords[joinkey]
      ]);
  });
  csv.writeToPath("data/packages_keywords_graph.csv", meta_rows, {headers: true})
    .on('finish', function() {
      console.log("done");
    });
});