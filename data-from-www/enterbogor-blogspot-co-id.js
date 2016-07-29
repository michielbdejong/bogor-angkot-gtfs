var fs = require('fs');

var lines = fs.readFileSync('enterbogor-blogspot-co-id.txt').toString().split('\n\n');

var places = {};
var routes = {};

for (var i=0; i<lines.length; i++) {
  var cells = lines[i].split('\n');
  var lineNo = cells[0].trim();
  routes[lineNo] = {
    stops: cells[2].split(/[-–]/).map(stop => stop.trim()),
    stopsBack: cells[4].split(/[-–]/).map(stop => stop.trim())
  };
  for (var j=0; j< routes[lineNo].stops.length; j++) {
    places[routes[lineNo].stops[j]] = true;
  }
  for (var j=0; j< routes[lineNo].stopsBack.length; j++) {
    places[routes[lineNo].stops[j]] = true;
  }
}

console.log(JSON.stringify({ places: Object.keys(places).sort(), routes}, null, 2));
