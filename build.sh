cd manual-from-transitwand/kota
zip -r ../../build/kota.zip *
cd ../kabupaten
zip -r ../../build/kabupaten.zip *
cd ../../data-from-www
node ./lovelybogor-com.js > ../build/lovelybogor.json
node ./kotabogor-go-id.js > ../build/kotabogor.json
node ./majalahtransportasi-com.js > ../build/majalah.json
node ./bogor-2menit-com.js > ../build/2menit.json
node ./enterbogor-blogspot-co-id.js > ../build/enterbogor.json
cd ..
node ./joinData.js > build/joined.json
node ./make-gtfs.js > release/shapes.txt
node ./gen-gtfs.js
cd release
zip -r ../release.zip *
cd ..
node listAllStopsPerRoute.js > build/stopsPerRoute.json
node makeTables.js > tables.html
node migrate-data.js > build/stretches.txt
