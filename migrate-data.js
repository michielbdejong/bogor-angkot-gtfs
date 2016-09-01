var fs = require('fs');
var mathjs = require('mathjs');
var numLanes = {};
var lastLine;
const NAME_COL = 0;
const LAT_COL = 1;
const LON_COL = 2;
const LANE_FACTOR = 10000;

//...
fs.readFileSync('./manual-from-transitwand/kota/shapes.txt').toString().split('\n').map(line => {
  var columns = line.split(',');
  if (lastLine && lastLine[NAME_COL] == columns[NAME_COL]) {
    processStretch(columns[NAME_COL],
                   parseFloat(lastLine[LAT_COL]), parseFloat(lastLine[LON_COL]),
                   parseFloat(columns[LAT_COL]), parseFloat(columns[LON_COL]));
  }
  lastLine = columns;
});

function perpendicularVector(fromX, fromY, toX, toY) {
  var distance = mathjs.distance([fromX, fromY], [toX, toY]);
  var normalized = [(toX-fromX)/(LANE_FACTOR*distance), (toY-fromY)/(LANE_FACTOR*distance)];
  // NE, shift NW
  // SE, shift NE
  // East, shift North
  // NW, shift SW
  // SW, shift SE
  // West, shift South
  // North, shift West
  // South, shift East
  // Stationary, don't shift
  return [-normalized[1], normalized[0]];
}

function processStretch(routeName, fromX, fromY, toX, toY) {
  var laneVector = perpendicularVector(fromX, fromY, toX, toY);
  var stretchDef = [fromX, fromY, toX, toY].join(',');
  if (typeof numLanes[stretchDef] === 'undefined') {
    numLanes[stretchDef] = 0;
  }
  var lane = ++numLanes[stretchDef];
  var laneFromX = fromX + lane * laneVector[0];
  var laneFromY = fromY + lane * laneVector[1];
  var laneToX = toX + lane * laneVector[0];
  var laneToY = toY + lane * laneVector[1];
  console.log([routeName, laneFromX, laneFromY, laneToX, laneToY].join(','));
}
