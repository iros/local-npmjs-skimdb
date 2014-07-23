# Gets all packages from couch, and extracts their names
curl http://192.168.33.31:5984/registry/_all_docs?include_docs=false > data/all_packages.json | underscore -i data/all_packages.json extract 'rows' | underscore pluck id > data/all_packages_names.json

# remove original file. It's large and we don't need it.
rm data/all_packages.json
