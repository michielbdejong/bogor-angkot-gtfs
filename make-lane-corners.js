var fs = require('fs');
var mathjs = require('mathjs');
var routes = {};
var cornerPoints = {};
const NAME_COL = 0;
const LAT_COL = 1;
const LON_COL = 2;
const STOP_COL = 5;
const LANE_FACTOR = 10000;

function readPoints() {
  var firstLine = true;
  fs.readFileSync('./manual-from-transitwand/kota/shapes.txt').toString().split('\n').map(line => {
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
  //    columns[STOP_COL],
    ]);
  });
}

function assignLanes() {
  var numLanes = {};
  for (var routeName in routes) {
    for (var i=0; i<routes[routeName].length; i++) {
      var stretchDef = [
        routes[routeName][i][0],
        routes[routeName][i][1],
        routes[routeName][(i+1) % routes[routeName].length][0],
        routes[routeName][(i+1) % routes[routeName].length][1],
      ].join(',');
      if (typeof numLanes[stretchDef] === 'undefined') {
        numLanes[stretchDef] = 0;
      }
      var lane = ++numLanes[stretchDef];
      // to each point, add the lane to be used after that point
      routes[routeName][i].push(lane);
    }
  }
}

function perpendicularVector(fromX, fromY, toX, toY) {
  var distance = mathjs.distance([fromX, fromY], [toX, toY]);
  if (distance === 0) {
    return [0, 0];
  }
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

function lineThrough(a, b) {
  //console.log('line through', a, b);
  var numLanes = a[2];
  var laneVector = perpendicularVector(a[0], a[1], b[0], b[1]);
  var fromX = a[0] + numLanes * laneVector[0];
  var fromY = a[1] + numLanes * laneVector[1];
  var toX = b[0] + numLanes * laneVector[0];
  var toY = b[1] + numLanes * laneVector[1];
  // two points define a line
  //      fix x, var x,    fix y, var y
  return [fromX, toX-fromX, fromY, toY-fromY];
}

function cutLines(a, b) {
  // x = a[0] + a[1]*k = b[0] + b[1]*l
  // move terms  a[1]*k = b[0] + b[1]*l - a[0]
  // divide      k = (b[0] + b[1]*l - a[0]) / a[1]
  // y = a[2] + a[3]*(         k           ) = b[2] + b[3]*l
  // fill in k   a[2] + a[3]*(b[0]+b[1]*l-a[0])/a[1] = b[2] + b[3]*l
  // move terms  a[3]*(b[0]+b[1]*l-a[0])/a[1] - b[3]*l = b[2] - a[2]
  // divide            b[0]+b[1]*l-a[0] - b[3]*l/(a[3]/a[1]) = (b[2] - a[2])/(a[3]/a[1])
  // group terms       b[0] - a[0] + b[1]*l - (b[3]/(a[3]/a[1]))*l = (b[2]-a[2])/(a[3]/a[1])
  // move terms                      b[1]*l - (b[3]/(a[3]/a[1]))*l = (b[2]-a[2])/(a[3]/a[1]) - b[0] + a[0]
  // group terms                    (b[1]   - (b[3]/(a[3]/a[1]))) * l =  (b[2]-a[2])/(a[3]/a[1]) - b[0] + a[0]
  // divide                                                         l = ((b[2]-a[2])/(a[3]/a[1]) - b[0] + a[0]) / (b[1]   - (b[3]/(a[3]/a[1])))
  var l = ((b[2]-a[2])/(a[3]/a[1]) - b[0] + a[0]) / (b[1]   - (b[3]/(a[3]/a[1])));
  // x = b[0] + b[1]*l = a[0] + a[1]*k
  // move terms  b[1]*l = a[0] + a[1]*k - b[0]
  // divide      l = (a[0] + a[1]*k - b[0]) / b[1]
  // y = b[2] + b[3]*(         l           ) = a[2] + a[3]*k
  // fil in l   b[2] + b[3]*(a[0]+a[1]*k-b[0])/b[1] = a[2] + a[3]*k
  // move terms  b[3]*(a[0]+a[1]*k-b[0])/b[1] - a[3]*k = a[2] - b[2]
  // divide            a[0]+a[1]*k-b[0] - a[3]*k/(b[3]/b[1]) = (a[2] - b[2])/(b[3]/b[1])
  // group terms       a[0] - b[0] + a[1]*k - (a[3]/(b[3]/b[1]))*k = (a[2]-b[2])/(b[3]/b[1])
  // move terms                      a[1]*k - (a[3]/(b[3]/b[1]))*k = (a[2]-b[2])/(b[3]/b[1]) - a[0] + b[0]
  // group terms                    (a[1]   - (a[3]/(b[3]/b[1]))) * k =  (a[2]-b[2])/(b[3]/b[1]) - a[0] + b[0]
  // divide                                                         k = ((a[2]-b[2])/(b[3]/b[1]) - a[0] + b[0]) / (a[1]   - (a[3]/(b[3]/b[1])))
  var k = ((a[2]-b[2])/(b[3]/b[1]) - a[0] + b[0]) / (a[1]   - (a[3]/(b[3]/b[1])));
  var x = b[0] + b[1]*l;
  var y = b[2] + b[3]*l;
  if (isNaN(x) || isNaN(y)) {
    x = a[0] + a[1]*k;
    y = a[2] + a[3]*k;
  }
  if (isNaN(x) || isNaN(y)) {
    var finishXA = a[0]+a[1];
    var finishYA = a[2]+a[3];
    var startXB = b[0];
    var startYB = b[2];
    var x = (finishXA + startXB)/2;
    var y = (finishYA + startYB)/2;
  }
  return [x, y];
}

function makeCornerPoint(routeName, before, here, after) {
  var beforeLine = lineThrough(before, here);
  var afterLine = lineThrough(here, after);
  return cutLines(beforeLine, afterLine);
}

function traceRoute(routeName) {
  var cornerPoints = [];
  var points = routes[routeName];
  for (var i=0; i<points.length; i++) {
    cornerPoints.push(makeCornerPoint(
      routeName,
      points[i],
      points[(i+1) % points.length],
      points[(i+2) % points.length]));
  }
  for (var i=0; i<cornerPoints.length; i++) {
    console.log([
      routeName,
      cornerPoints[i][0],
      cornerPoints[i][1],
      cornerPoints[(i+1) % cornerPoints.length][0],
      cornerPoints[(i+1) % cornerPoints.length][1],
    ].join(','));
  }
}

readPoints();
assignLanes();
for (var routeName in routes) {
  traceRoute(routeName);
}

//     stretch.laneVector = perpendicularVector(stretch.fromX, stretch.fromY, stretch.toX, stretch.toY);
//     var stretchDef = [stretch.fromX, stretch.fromY, stretch.toX, stretch.toY].join(',');
//     if (typeof numLanes[stretchDef] === 'undefined') {
//       numLanes[stretchDef] = 0;
//     }
//     stretch.lane = ++numLanes[stretchDef];
//     sendStretch(stretch);
//   }
//   lastLine = columns;
// });
// // curve last route back to start
// sendStretch();
// 
// 
// var currentRoute;
// var buffer = [];
// function sendStretch(params) {
//   if (Array.isArray(params)) {
//     if (currentRoute !== params[0]) {
//       if (currentRoute) {
//         finishRoute();
//         buffer = [];
//       }
//       currentRoute = params[0];
//     }
//     buffer.push(params);
//   } else {
//     finishRoute();
//   }
// }
// 
// function finishRoute() {
//   processStretch(buffer[buffer.length-1], buffer[0], buffer[1]);
//   for (var i=1; i<buffer.length-1; i++) {
//     processStretch(buffer[i-1], buffer[i], buffer[i+1]);
//   }
//   processStretch(buffer[buffer.length-2], buffer[buffer.length-1], buffer[0]);
//   curr
// }
// 
// 
// var thisRouteName;
// var thisRouteStart;
// var lastToPoint;
// var firstLaneVector;
// var lastLaneVector;
// 
// function processStretch(previous, current, next) {
//   // draw current from its crossing point with previous to its crossing point with next
//   var [routeName, fromX, fromY, toX, toY] = current;
// 
//   function outputStretch() {
//     console.log([routeName, laneFromX, laneFromY, laneToX, laneToY, 'stretch'].join(','));
//   }
//   function outputCurveBefore() {
// //    console.log([routeName,
// //      lastToPoint[0], lastToPoint[1],
// //      laneFromX, laneFromY, 'curve-before'].join(','));
//   }
//   function outputCurveBackToStart(lastRouteName) {
// //    console.log([lastRouteName,
// //      lastToPoint[0], lastToPoint[1],
// //      thisRouteStart[0], thisRouteStart[1], 'curve-back'].join(','));
//   }
//   if (routeName) {
//     if (thisRouteName === routeName) { // continuing on same route
//        outputCurveBefore();
//        outputStretch();
//     } else { // started a new route
//       if (thisRouteName) { // this is not the first, there was a previous route
//         outputCurveBackToStart(thisRouteName);
//       }
//       thisRouteName = routeName;
//       thisRouteStart = [laneFromX, laneFromY];
//       firstLaneVector = laneVector;
//       outputStretch();
//     }
//     lastToPoint = [laneToX, laneToY];
//     lastLaneVector = laneVector;
//   } else {
//     outputCurveBackToStart(thisRouteName);
//   }
// }
