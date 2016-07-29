var fs = require('fs');

var joined = JSON.parse(fs.readFileSync('./build/joined.json'));
var coordEntries = fs.readFileSync('./coords.txt').toString().split('\n').map(line => line.split('\t'));
var coords = {};

for (var i=0; i<coordEntries.length; i++) {
  coords[coordEntries[i][2]] = coordEntries[i];
}

console.log('shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled');

for (var lineNo in joined.routes) {
  // console.log(lineNo, joined.routes[lineNo].stops.lovelybogor);
  if(joined.routes[lineNo].stops.lovelybogor) {
    var shapePtSeq = 1;
    for (var i = 0; i<joined.routes[lineNo].stops.lovelybogor.length; i++) {
      var coordsTuple = coords[joined.routes[lineNo].stops.lovelybogor[i]];
      // console.log(coordsTuple, joined.routes[lineNo].stops.lovelybogor[i]);
      if (Array.isArray(coordsTuple) &&
          coordsTuple.length >= 3 &&
          coordsTuple[0] != -6.6) {
        console.log(`${lineNo},${coordsTuple[0]},${coordsTuple[1]},${shapePtSeq++},${0.01*i},${coordsTuple[2].trim()}`);
      }
    }
  }
}
