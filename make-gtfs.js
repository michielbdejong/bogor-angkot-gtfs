var fs = require('fs');

var joined = JSON.parse(fs.readFileSync('./release/joined.json'));
var coordEntries = fs.readFileSync('./coords.txt').toString().split('\n').map(line => line.split('\t'));
var coords = {};

for (var i=0; i<coordEntries.length; i++) {
  coords[coordEntries[i][2]] = coordEntries[i];
}

for (var lineNo in joined.routes) {
  // console.log(lineNo, joined.routes[lineNo].stops.lovelybogor);
  if(joined.routes[lineNo].stops.lovelybogor) {
    for (var i = 0; i<joined.routes[lineNo].stops.lovelybogor.length; i++) {
      var coordsTuple = coords[joined.routes[lineNo].stops.lovelybogor[i]];
      // console.log(coordsTuple, joined.routes[lineNo].stops.lovelybogor[i]);
      console.log(`${lineNo},${coordsTuple[0]},${coordsTuple[1]},${i},${i},${joined.routes[lineNo].stops.lovelybogor[i].trim()}`);
    }
  }
}
