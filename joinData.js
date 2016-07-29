var fs = require('fs');

var data = {
  majalah: JSON.parse(fs.readFileSync('./release/majalah.json')),
  '2menit': JSON.parse(fs.readFileSync('./release/2menit.json')),
  lovelybogor: JSON.parse(fs.readFileSync('./release/lovelybogor.json')),
  kotabogor: JSON.parse(fs.readFileSync('./release/kotabogor.json'))
}

var joined = {
  places: {},
  routes: {}
};

for (var source in data) {
  for (var i=0; i < data[source].places.length; i++) {
    joined.places[data[source].places[i]] = true;
  }
  for (var lineNo in data[source].routes) {
    if (typeof joined.routes[lineNo] === 'undefined') {
      joined.routes[lineNo] = {
        name: {},
        colour: {},
        stops: {}
      };
    }
    joined.routes[lineNo].name[source] = data[source].routes[lineNo].name;
    joined.routes[lineNo].colour[source] = data[source].routes[lineNo].colour;
    joined.routes[lineNo].stops[source] = data[source].routes[lineNo].stops;
  }
}
joined.places = Object.keys(joined.places).sort();

// For creating coords.txt:
// console.log(joined.places.join('\n-6.6\t106.8\t'));

console.log(JSON.stringify(joined, null, 2));
