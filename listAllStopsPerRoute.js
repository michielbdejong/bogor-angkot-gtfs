var fs = require('fs');

var joined = JSON.parse(fs.readFileSync('./build/joined.json'));
var coordEntries = fs.readFileSync('./coords.txt').toString().split('\n').map(line => line.split('\t'));
var coords = {};

for (var i=0; i<coordEntries.length; i++) {
  coords[coordEntries[i][2]] = coordEntries[i];
}

var stopsPerLine = {};

for (var lineNo in joined.routes) {
  // console.log(lineNo, joined.routes[lineNo]);   
  stopsPerLine[lineNo] = {};
  for(var source in joined.routes[lineNo].stops) {
    var stopsList = joined.routes[lineNo].stops[source];
    // console.log(lineNo, source, stopsList);   
    if (Array.isArray(stopsList)) {
      for (var i=0; i<stopsList.length; i++) {
        stopsPerLine[lineNo][stopsList[i]] = coords[stopsList[i]];
      }
    }
  }
}

console.log(JSON.stringify(stopsPerLine, null, 2));
