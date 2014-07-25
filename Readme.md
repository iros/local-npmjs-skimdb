
# Setup your own npm skim db replica

https://skimdb.npmjs.com/registry is the couchdb registry, minus the actual packages,
meaning it's small. If you're just trying to get data about available packages, this is
probably the easiest way to go about it.


## Setup your box

First, setup your couchdb server.

0. Run `npm install` if you're going to run any of the data scripts.
1. Run `vagrant up`.
2. Run `vagrant ssh`.
3. Install couch:


    ```bash
    sudo apt-get update
    sudo apt-get install build-essential autoconf automake libtool erlang libicu-dev libmozjs-dev libcurl4-openssl-dev
    wget http://mirrors.ibiblio.org/apache/couchdb/source/1.6.0/apache-couchdb-1.6.0.tar.gz
    tar xvf apache-couchdb-1.6.0.tar.gz
    cd apache-couchdb-1.6.0/
    ./configure
    make
    sudo make install
    ```

4. Change couchdb bind address, so you can access it by editing

    ```bash
    vi /usr/local/etc/couchdb/default.ini
    ```

  Change `bind_address` to `0.0.0.0`.
  More instructions [here](http://couchdb.readthedocs.org/en/latest/config/http.html#httpd/bind_address)
  if you want to be more specific.

5. Start Couch

  While ssh'd into vagrant box, run `sudo couchdb` or `sudo couchdb -d`
  Verify you can reach it at http://192.168.33.31:5984/ (the IP is setup as a private
  network in the Vagrantfile. If you need to change it, change it there.)

6. Start couch replication against skimdb:

  From a terminal window that is *not* ssh'd to the vagrant box:

  ```bash
  curl -X POST http://192.168.33.31:5984/_replicate -d '{"source":"https://skimdb.npmjs.com/registry/", "target":"registry", "create_target":true}' -H "Content-Type: application/json"
  ```

## Data

Aside from creating a clone of npm's skimdb, this repo also contains scripts to generate
data files that can be used to analyze the data. They are all in the `scripts` directory.
All data goes into the `data` directory.

### Prep scripts:

* `get_all_docs.js` - creates a file for each package under `data/packages`. It is a prerequisite for `get_all_packages.sh`.
* `get_all_packages.sh` - creates `data/all_packages_names.json` which is just an array of all available packages.
  It is a prerequisite for all other scripts.

### Data Scripts

* `build_metadata.js` - Builds a general metadata file for all packages called `data/packages_meta.csv`
* `build_dependencies.js` - Builds two dependency tree files, one for regular dependencies, and one for dev dependencies.
* `build_keyword_graph.js` - Builds a keyword source & target pairs for all keyword co-occurance + weight (count)
* `build_versions.js` - Builds a list of all versions per package & associated timestamps.

