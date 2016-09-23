#!/bin/bash

cp release/map.svg ../michielbdejong.com/angkots.svg
cd ../michielbdejong.com
git commit -am"Update angkots map"
git push
cd ../bogor-angkot-gtfs
