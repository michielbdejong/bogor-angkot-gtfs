// packages
var mathjs = require('mathjs');

// constants
const LANE_FACTOR = 20000;

// functions
function parallelVector(fromX, fromY, toX, toY) {
  var distance = mathjs.distance([fromX, fromY], [toX, toY]);
  if (distance === 0) {
    return [0, 0];
  }
  return [(toX-fromX)/(LANE_FACTOR*distance), (toY-fromY)/(LANE_FACTOR*distance)];
}

function perpendicularVector(fromX, fromY, toX, toY) {
  var normalized = parallelVector(fromX, fromY, toX, toY);
  return [-normalized[1], normalized[0]];
}

function lineThrough(a, b) {
  // each of a and b contain:
  // [lat, lon, stop_name, stretchDef-before, lane]
  // a = [lat, lon] -> [y, x]
  // b = [lat, lon] -> [y, x]

  var startLane = getLaneAtPoint(a);
  var endLane = getLaneAtPoint(b);
  // console.log('line through', a, b, lineLane);
  var laneVector = perpendicularVector(a[1], a[0], b[1], b[0]);
  var preVector = parallelVector(a[1], a[0], b[1], b[0]);
  var middleX = (a[1] + b[1])/2;
  var middleY = (a[0] + b[0])/2;
  var switchStartBaseX = middleX - Math.abs(b[4]-a[4])*preVector[0];
  var switchStartBaseY = middleY - Math.abs(b[4]-a[4])*preVector[1];
  var switchEndBaseX = middleX + Math.abs(b[4]-a[4])*preVector[0];
  var switchEndBaseY = middleY + Math.abs(b[4]-a[4])*preVector[1];

  var fromX = a[1] + startLane * laneVector[0];
  var fromY = a[0] + startLane * laneVector[1];
  var switchStartX = switchStartBaseX + startLane * laneVector[0];
  var switchStartY = switchStartBaseY + startLane * laneVector[1];
  var switchEndX = switchEndBaseX + endLane * laneVector[0];
  var switchEndY = switchEndBaseY + endLane * laneVector[1];
  var toX = b[1] + endLane * laneVector[0];
  var toY = b[0] + endLane * laneVector[1];
  // console.log({ a, b, lineLane, laneVector, preVector, fromX, fromY, switchStartX, switchStartY, switchEndX, switchEndY, toX, toY });
  // two points define a line
  //      fix x, var x,    fix y, var y
  return {
    start: [fromX, switchStartX-fromX, fromY, switchStartY-fromY],
    switcher: [switchStartX, switchEndX-switchStartX, switchStartY, switchEndY-switchStartY],
    end: [switchEndX, toX-switchEndX, switchEndY, toY-switchEndY],
  };
}

function cutLines(a, b, fallbackCoords) {
  // return [fallbackCoords[1], fallbackCoords[0]];
  // a and b are like start,switcher,end from previous function
  // fallbackCoords contains:
  // [lat, lon, stop_name, stretchDef-before, lane]
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
  var x = b[0] + b[1]*l;
  var y = b[2] + b[3]*l;

  function coordsOK(x, y) {
    // console.log('coordsOK', x, y);
    if (isNaN(x)) return false;
    if (isNaN(y)) return false;
    if (Math.abs(x) === Infinity) return false;
    if (Math.abs(y) === Infinity) return false;
    if (x > 106.9) return false;
    if (x < 106.7) return false;
    if (y > -6.5) return false;
    if (y < -6.7) return false;
    return true;
  }

  if (coordsOK(x, y)) {
    // console.log('cutting with l', a, b, [x, y]);
    return [x, y];
  }
  var k = ((a[2]-b[2])/(b[3]/b[1]) - a[0] + b[0]) / (a[1]   - (a[3]/(b[3]/b[1])));
  x = a[0] + a[1]*k;
  y = a[2] + a[3]*k;
  if (coordsOK(x, y)) {
    // console.log('cutting with k', a, b, [x, y]);
    return [x, y];
  }
  // x = fallbackCoords[1];
  // y = fallbackCoords[0];

  var finishXA = a[0]+a[1];
  var finishYA = a[2]+a[3];
  var startXB = b[0];
  var startYB = b[2];
  x = (finishXA + startXB)/2;
  y = (finishYA + startYB)/2;
  if (coordsOK(x, y)) {
    // console.log('end point - lines are parallel', a, b, [x, y]);
    return [x, y];
  }
  console.error('Failure to cut lines', a, b, [x, y]);
}

function getLaneAtPoint(here) {
  // here contains: [lat, lon, stop_name, stretchDef-before, lane]
  // shift lanes around Kebun Raya to the right to avoid
  // overlapping with the streets surrounding the Kebun Raya:
  var laneShift = {
    'kb-gedong-sawah': -6,
    'kb-polisi-militer': -6,
    'kb-jalak-harupat': -6,
    'kb-sempur': -6,
    'kb-salak': -6,
    'kb-pangrango': -6,
    'kb-astrid': -6,
    'kb-botani-1': -6,
    'kb-botani-2': -6,
    'bangka-otista': -6,
    'otista-roda': -6,
    'kb-otista': -6,
    'kb-suryakencana': -6,
    'cincau-kb': -6,
    'kb-btm-1': -6,
    'kb-btm-2': -6,
    'kb-muslihat': -6,
  };
  var thisLaneShift = laneShift[here[2].trim()] || 0;
  return here[4] + thisLaneShift;
}

function makeCornerPoint(before, here, after) {
  // console.log('makeCornerPoint', { before, here, after });
  var beforeLine = lineThrough(before, here); // before.end should be at cornerLane; before.switcher should be from previous c.L.
  // lineThrough returns an object:
  //  start: [fromX, switchStartX-fromX, fromY, switchStartY-fromY],
  //  switcher: [switchStartX, switchEndX-switchStartX, switchStartY, switchEndY-switchStartY],
  //  end: [switchEndX, toX-switchEndX, switchEndY, toY-switchEndY],
  var afterLine = lineThrough(here, after);
  // each of before, here, after contains:
  // [lat, lon, stop_name, stretchDef-before, lane]
  // console.log(beforeLine, afterLine);
  return {
    coords: cutLines(beforeLine.end, afterLine.start, here),
    switcherLineBefore: beforeLine.switcher,
    here,
    debugLine: [before, here],
  };
}

function traceRoute(points) {
  var cornerPoints = [];
  for (var i=0; i<points.length; i++) {
    cornerPoints.push(makeCornerPoint(
      points[i],
      points[(i+1) % points.length],
      points[(i+2) % points.length]));
  }
  return cornerPoints;
}

module.exports = { lineThrough, LANE_FACTOR, parallelVector, traceRoute };
