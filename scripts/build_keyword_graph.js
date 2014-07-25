var forAllPackages = require('./lib/for_all_packages');
var packageUtils = require("./lib/package_utils");

var i = 0;

var exclude=[];
var keywords = {};

function addKeyPairs(package, doc) {

  if (exclude.indexOf(package) === -1) {

    try {

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

function transform(keywords) {
  return function() {

    var rows = [];

    Object.keys(keywords).forEach(function(joinkey) {
      var st = joinkey.split("::");
      rows.push([
          st[0],
          st[1],
          keywords[joinkey]
        ]);
    });

    return rows;
  };
}

forAllPackages(addKeyPairs, "packages_keyword_graph.csv", [
  ["target", "source", "count"]
], transform(keywords));
