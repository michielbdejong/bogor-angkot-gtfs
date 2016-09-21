var fs = require('fs');

const NAME_COL = 0;
const LAT_COL = 1;
const LON_COL = 2;
const STOP_COL = 5;

function readPoints() {
  var routes = {};
  var firstLine = true;
  fs.readFileSync('../manual-from-transitwand/kota/shapes.txt').toString().split('\n').map(line => {
  // fs.readFileSync('./test/shapes.txt').toString().split('\n').map(line => {
    if (firstLine) {
      firstLine = false;
      return;
    }
    var columns = line.split(',');
    if (columns.length < 5) {
      return;
    }
    if (typeof routes[columns[NAME_COL]] === 'undefined') {
      routes[columns[NAME_COL]] = [];
    }
    routes[columns[NAME_COL]].push([
      parseFloat(columns[LAT_COL]),
      parseFloat(columns[LON_COL]),
      columns[STOP_COL],
    ]);
  });
  return routes;
}

module.exports = { readPoints };

