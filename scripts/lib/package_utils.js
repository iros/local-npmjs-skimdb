var semver = require('semver-utils');
var _ = require('lodash');
var semver = require('semver-utils');

module.exports = {
  findLatestVersion: function(doc) {
    // find latest version
    var latest_version, clearversions;
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

    return latest_version;
  },

  findMaintainers: function(doc){
    // find maintainers
    var maintainers = [];
    if (doc.maintainers) {
      maintainers = doc.maintainers;
    } else if (doc.time && doc.time.unpublished && doc.time.unpublished.maintainers) {
      maintainers = doc.time.unpublished.maintainers;
    } else {
      maintainers = [];
    }

    return maintainers;
  },

  findNodeVersion: function(doc, latest_version) {
    if (doc.engines && doc.engines.node) {
      return doc.engines.node;
    } else if (latest_version && doc.versions) {
      if (doc.versions[latest_version] &&
        doc.versions[latest_version].engines &&
        doc.versions[latest_version].engines.node) {

        if (_.isObject(doc.versions[latest_version].engines.node)) {
          return doc.versions[latest_version].engines.node.node;
        } else {
          return doc.versions[latest_version].engines.node;
        }
      }
    }
    return "*";
  },

  findNumberOfVersions: function(doc) {
    // find version numbers
    var num_versions;

    if (doc.versions) {
      num_versions = Object.keys(doc.versions).length;
    } else {

      var clearversions = _.remove(Object.keys(doc.time), function(x) {
        return !(x === 'created' || x === 'modified' || x === 'unpublished');
      });
      if (clearversions.length) {
        num_versions = clearversions.length;
      }
    }
    return num_versions;
  },

  getKeywords: function(doc, latest_version) {
    if (doc.keywords) {
      return doc.keywords;
    } else if (latest_version && doc.versions) {
      if (doc.versions[latest_version]) {
        var k = doc.versions[latest_version].keywords;
        if (k) {
          return k;
        }
      }
    }
    return [];
  },

  getSemver: function(version) {
    var versem;
    if (version) {
      versem = semver.parse(version);
    } else {
      versem = { major : '', minor: '', patch: ''};
    }

    return versem;
  }
};