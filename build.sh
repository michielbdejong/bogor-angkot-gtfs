cd kota
zip -r ../release/kota.zip *
cd ../kabupaten
zip -r ../release/kabupaten.zip *
cd ..
node data-from-www/lovelybogor-com.js > release/lovelybogor.json
node data-from-www/kotabogor-go-id.js > release/kotabogor.json
node data-from-www/bogor-2menit-com.js > release/2menit.json
