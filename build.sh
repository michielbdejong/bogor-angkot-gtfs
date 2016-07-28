cd kota
zip -r ../release/kota.zip *
cd ../kabupaten
zip -r ../release/kabupaten.zip *
cd ..
node data-from-www/lovelybogor-com.js > release/lovelybogor.json
node data-from-www/kotabogor-go-id.js > release/kotabogor.json
