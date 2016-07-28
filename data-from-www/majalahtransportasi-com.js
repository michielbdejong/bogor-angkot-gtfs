var fs = require('fs');

var lines = fs.readFileSync('majalahtransportasi-com.txt').toString().split('\n\n');

var routes = {};

for (var i=0; i<lines.length; i++) {
  var cells = lines[i].split('\n');
  try {
    routes[cells[0]] = {
      name: cells[1].substring('Trayek: '.length),
      colour: cells[2].substring('Warna: '.length),
      stops: cells[3].substring('Rute: '.length).split(/[-–]/).map(stop => stop.trim())
    };
  } catch (e) {
    routes[cells[0]] = cells;
  }
}

console.log(routes);


