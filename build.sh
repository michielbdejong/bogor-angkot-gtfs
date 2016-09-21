# parse raw text from websites into json:
cd data-from-www
node ./lovelybogor-com.js > ../build/lovelybogor.json
node ./kotabogor-go-id.js > ../build/kotabogor.json
node ./majalahtransportasi-com.js > ../build/majalah.json
node ./bogor-2menit-com.js > ../build/2menit.json
node ./enterbogor-blogspot-co-id.js > ../build/enterbogor.json
cd ..
# join those json files into one joined file for easy comparison:
node ./joinData.js > release/from-www.json
# generate a gtfs feed (currently broken because routes don't loop, see #3)
# and save it as ./release/gtfs.zip:
node ./gen-gtfs.js
cd gtfs
zip -r ../release/gtfs.zip *
cd ../src
# generate the map and save it as ./release/map.svg:
node --harmony_destructuring index.js
cd ..
