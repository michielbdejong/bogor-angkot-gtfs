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
  // I would have thought this should be:
  // return [-normalized[1], normalized[0]];
  // to make the angkots drive on the left
  // side of the road, but apparently
  // when looking at the result,
  // (-, +) makes them drive on the right
  // side and (+, -) makes them drive on
  // the left:
  return [normalized[1], -normalized[0]];
}

function makeSpaceForCurve(fromX, fromY, toX, toY, laneVectorX, laneVectorY) {
  var spaceX = -laneVectorY;
  var spaceY = laneVectorX;
  return [fromX + spaceX, fromY + spaceY, toX - spaceX, toY - spaceY];
}

var thisRouteName;
var thisRouteStart;
var thisRouteLast;

function processStretch(routeName, fromX, fromY, toX, toY) {
  var laneVector = perpendicularVector(fromX, fromY, toX, toY);
  var stretchDef = [fromX, fromY, toX, toY].join(',');
  if (typeof numLanes[stretchDef] === 'undefined') {
    numLanes[stretchDef] = 0;
  }
  var lane = ++numLanes[stretchDef];
  var [laneFromX, laneFromY, laneToX, laneToY] = makeSpaceForCurve(
    fromX + lane * laneVector[0],
    fromY + lane * laneVector[1],
    toX + lane * laneVector[0],
    toY + lane * laneVector[1],
    laneVector[0],
    laneVector[1]
  );
  function outputStretch() {
    console.log([routeName, laneFromX, laneFromY, laneToX, laneToY].join(','));
  }
  function outputCurveBefore() {
    console.log([routeName,
      thisRouteLast[0], thisRouteLast[1],
      laneFromX, laneFromY].join(','));
  }
  function outputCurveBackToStart(lastRouteName) {
    console.log([lastRouteName,
      laneToX, laneToY,
      thisRouteStart[0], thisRouteStart[1]].join(','));
  }
  if (thisRouteName === routeName) { // continuing on same route
     outputCurveBefore();
     outputStretch();
  } else { // started a new route
    if (thisRouteName) { // this is not the first, there was a previous route
      outputCurveBackToStart(thisRouteName);
    }
    thisRouteName = routeName;
    thisRouteStart = [laneFromX, laneFromY];
    outputStretch();
  }
  thisRouteLast = [laneToX, laneToY];
}
