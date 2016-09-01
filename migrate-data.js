var fs = require('fs');
var mathjs = require('mathjs');
var stretches = [];
var lanes = [];
var lastLine;

function processStretch(from, to) {
  var stretchDef = [from[1], from[2], to[1], to[2]].join(',');
  if (typeof stretches[stretchDef] === 'undefined') {
    stretches[stretchDef] = [];
  }
  stretches[stretchDef].push(from[0]);
}


//...
fs.readFileSync('./manual-from-transitwand/kota/shapes.txt').toString().split('\n').map(line => {
  var columns = line.split(',');
  if (lastLine && lastLine[0] == columns[0]) {
    processStretch(lastLine, columns);
  }
  lastLine = columns;
});

function perpendicularVector(coords) {
  var distance = mathjs.distance([coords[0], coords[1]], [coords[2], coords[3]]);
  var normalized = [(coords[2]-coords[0])/distance, (coords[3]-coords[1])/distance];
  // NE, shift NW
  // SE, shift NE
  // East, shift North
  // NW, shift SW
  // SW, shift SE
  // West, shift South
  // North, shift West
  // South, shift East
  // Stationary, don't shift
  return [-normalized[1], normalized[0]);
}


for (var stretchDef in stretches) {
  var coords = stretchDef.split(',').map(x => parseFloat(x));
  var laneVector = perpendicularVector(coords);
  for (var lane = 0; lane<stretches[stretchDef].length;lane++) {
    var start = [coords[0] + (lane+1) * laneVector[0],
                 coords[1] + (lane+1) * laneVector[1]];
    var finish = [coords[2] + (lane+1) * laneVector[0],
                  coords[3] + (lane+1) * laneVector[1]];
    var routeName = stretches[stretchDef][lane];
    console.log(`${routeName},${start[0]},${start[1]},${finish[0]},${finish[1]}`);
  }
}
