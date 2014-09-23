var fs = require('fs');

var db = require('nano')('http://192.168.33.31:5984/registry'),

  // if the import breaks, set the startkey: '' to the last imported lib.
  params   = {include_docs: true, limit: 200, skip: 0, startkey:'aone'},

  has_docs = true;


function getDocs(params) {
  db.list(params, function(error, body, headers) {

    if (error) { console.log(error); return; }

    console.log("fetching", params.skip, "-", params.skip + params.limit);

    if (body.rows.length === 0) {
      has_docs = false;
    } else {

      var keys = [];
      body.rows.forEach(function(doc) {
        keys.push(doc.id);
        if (doc.id !== "_design/app" && doc.id !== "_design/scratch") {
          var filepath = "data/packages/" + doc.id + ".json";
          fs.writeFileSync(filepath, JSON.stringify(doc));
        }
      });

      console.log("wrote", keys.length);
      params.skip = params.skip + params.limit;

      getDocs(params);
    }
  });
}

getDocs(params);