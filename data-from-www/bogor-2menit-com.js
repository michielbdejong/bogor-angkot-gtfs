var fs = require('fs');

var lines = fs.readFileSync('bogor-2menit-com.txt').toString().split('\n\n');

var places = {};
var routes = {};

for (var i=0; i<lines.length; i++) {
  var cells = lines[i].split('\n');
  var firstLineParts = cells[0].split(', Jurusan: ');
  var lineNo = firstLineParts[0].substring('Trayek '.length);
  routes[lineNo] = {
    name: firstLineParts[1].trim(),
    stops: cells[1].substring('Rute: '.length).split(/[-–]/).map(stop => stop.trim())
  };
  for (var j=0; j<routes[lineNo].stops.length; j++) {
    places[routes[lineNo].stops[j]] = true;
  }
}

console.log(JSON.stringify({ places: Object.keys(places).sort(), routes}, null, 2));
