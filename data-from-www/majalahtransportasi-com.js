var fs = require('fs');

var lines = fs.readFileSync('majalahtransportasi-com.txt').toString().split('\n\n');

var places = {};
var routes = {};

for (var i=0; i<lines.length; i++) {
  var cells = lines[i].split('\n');
  var lineNo = cells[0].trim();
  routes[lineNo] = {
    name: cells[1].substring('Trayek: '.length),
    colour: cells[2].substring('Warna: '.length),
    stops: cells[3].substring('Rute: '.length).split(/[-–]/).map(stop => stop.trim())
  };
  for (var j=0; j< routes[lineNo].length; j++) {
    places[routes[lineNo].stops[j]] = true;
  }
}

console.log(JSON.stringify({ places: Object.keys(places).sort(), routes}, null, 2));
