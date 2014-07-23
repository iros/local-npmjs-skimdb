
# Setup your own npm skim db replica

https://skimdb.npmjs.com/registry is the couchdb registry, minus the actual packages,
meaning it's small. If you're just trying to get data about available packages, this is
probably the easiest way to go about it.


## Setup your box

First, setup your couchdb server.

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
  Verify you can reach it at http://192.168.33.31:5984/

6. Start couch replication against skimdb:

  From a terminal window that is *not* ssh'd to the vagrant box:

  `curl -X POST http://192.168.33.31:5984/_replicate -d '{"source":"https://skimdb.npmjs.com/registry/", "target":"registry", "create_target":true}' -H "Content-Type: application/json"`

