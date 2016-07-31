var fs = require('fs');

var data = {
  majalah: JSON.parse(fs.readFileSync('./build/majalah.json')),
  '2menit': JSON.parse(fs.readFileSync('./build/2menit.json')),
  lovelybogor: JSON.parse(fs.readFileSync('./build/lovelybogor.json')),
  kotabogor: JSON.parse(fs.readFileSync('./build/kotabogor.json')),
  enterbogor: JSON.parse(fs.readFileSync('./build/enterbogor.json')),
};

var coordLines = fs.readFileSync('./coords.txt').toString().split('\n').map(line => {
  return line.split('\t');
});

var manualLines = fs.readFileSync('./manual-from-transitwand/kota/shapes.txt').toString().split('\n').map(line => {
  return line.split(',');
});

var joined = {
  places: {},
  routes: {},
  coords: {},
};

for (var i=0; i<coordLines.length; i++) {
  if (coordLines[i].length>2) {
    joined.coords[coordLines[i][2]] = coordLines[i];
  }
}

function normalize(data) {
  if (typeof data === 'string') {
    return data.split(' ').join('').toLowerCase();
  } else if (Array.isArray(data)) {
    return data.map(elt => normalize(elt));
  } else {
    return data;
  }
}

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
    joined.routes[lineNo].name[source] = normalize(data[source].routes[lineNo].name);
    joined.routes[lineNo].colour[source] = normalize(data[source].routes[lineNo].colour);
    joined.routes[lineNo].stops[source] = normalize(data[source].routes[lineNo].stops);
    joined.routes[lineNo].stops[`${source}-back`] = normalize(data[source].routes[lineNo].stopsBack);
  }
}
for (var i=1; i<manualLines.length; i++) {
  var lineNo = manualLines[i][0];
  if (typeof joined.routes[lineNo] === 'undefined') {
    joined.routes[lineNo] = {
      name: {},
      colour: {},
      stops: {}
    };
  }
  if (typeof joined.routes[lineNo].stops.manual == 'undefined') {
    joined.routes[lineNo].stops.manual = [];
  }
  joined.routes[lineNo].stops.manual.push(`ll_${manualLines[i][1]}_${manualLines[i][2]}`);
}

joined.places = Object.keys(joined.places).sort();

// For creating coords.txt:
// console.log(joined.places.join('\n-6.6\t106.8\t'));

console.log(JSON.stringify(joined, null, 2));
