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
            var keyword = latest_version_doc.keywords[j];
            if (typeof keywords[keyword] !== "undefined") {
              keywords[keyword].push(doc._id);
            } else {
              keywords[keyword] = [doc._id];
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

    Object.keys(keywords).forEach(function(keyword) {

      rows.push([
          keyword,
          keywords[keyword].length,
          keywords[keyword]
        ]);
    });

    return rows;
  };
}

forAllPackages(addKeyPairs, "keyword_packages.csv", [
  ["keyword", "package_count", "packages"]
], transform(keywords));
