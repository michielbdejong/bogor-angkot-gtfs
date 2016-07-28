cd kota
zip -r ../release/kota.zip *
cd ../kabupaten
zip -r ../release/kabupaten.zip *
cd ../data-from-www
node ./lovelybogor-com.js > ../release/lovelybogor.json
node ./kotabogor-go-id.js > ../release/kotabogor.json
node ./majalahtransportasi-com.js > ../release/majalah.json
node ./bogor-2menit-com.js > ../release/2menit.json
cd ..
