var fs = require('fs');

var lines = fs.readFileSync('bogor-2menit-com.txt').toString().split('\n\n');

var routes = {};

for (var i=0; i<lines.length; i++) {
  var cells = lines[i].split('\n');
  var firstLineParts = cells[0].split(', Jurusan: ');
  try {
    routes[firstLineParts[0].substring('Trayek '.length)] = {
      name: firstLineParts[1].trim(),
      stops: cells[1].substring('Rute: '.length).split(/[-–]/).map(stop => stop.trim())
    };
  } catch (e) {
    routes[firstLineParts[0].substring('Trayek '.length)] = cells;
  }
}

console.log(JSON.stringify({routes}, null, 2));
