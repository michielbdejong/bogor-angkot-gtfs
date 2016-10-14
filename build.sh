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
# generate a gtfs feed
# and save it as ./release/gtfs.zip:
node ./gen-gtfs.js
cd gtfs
zip -r ../release/gtfs.zip *
cd ..

# generate the map and save it as ./release/map.svg:
cd src
# for older versions of nodejs, use:
# node --harmony_destructuring index.js
node index.js
cd ..
