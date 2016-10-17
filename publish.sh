#!/bin/bash

cp release/map.svg ../michielbdejong.com/angkots.svg
cp release/gtfs.zip ../michielbdejong.com/angkots-gtfs.zip
cd ../michielbdejong.com
git commit -am"Update angkots map and gtfs"
git push
cd ../bogor-angkot-gtfs
