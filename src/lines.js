// packages
var mathjs = require('mathjs');

// constants
const LANE_FACTOR = 5000;
const LANE_SWITCH_DIST = 10/LANE_FACTOR;

// functions
function assignLanesTo(/* by ref */ routes) {
  // FIXME: this function alters its argument,
  // would be nicer to refactor this to functional paradigm
  var lanes = {};

  for (var routeName in routes) {
    for (var i=1; i<=routes[routeName].length; i++) {
      var stretchDef = [
        routes[routeName][i-1][0],
        routes[routeName][i-1][1],
        routes[routeName][i % routes[routeName].length][0],
        routes[routeName][i % routes[routeName].length][1],
      ].join(',');
      routes[routeName][i % routes[routeName].length].push(stretchDef);
      // so it now contains [lat, lon, stop_name, stretchDef-before]
      if (typeof lanes[stretchDef] === 'undefined') {
        lanes[stretchDef] = [];
      }
      var onwardAngle = angle([
        routes[routeName][i-1][1], // lon -> x
        routes[routeName][i-1][0], // lat -> y
      ], [
        routes[routeName][i % routes[routeName].length][1],
        routes[routeName][i % routes[routeName].length][0],
      ], [
        routes[routeName][(i+1) % routes[routeName].length][1],
        routes[routeName][(i+1) % routes[routeName].length][0],
      ]);
      lanes[stretchDef].push({ routeName, onwardAngle });
    }
  }
  // Now we have a list of routes that ride each stretch, we should
  // decide who ends that stretch in which lane.
  // Start lane is then always the same as last end lane.
  // The end lane should depend on the onward angle.
  // So at each route point, compare the angle to that of routes that
  // have the same previous stretch.
  for (var stretchDef in lanes) {
   //  console.log('unsorted', lanes[stretchDef]);
    lanes[stretchDef].sort((a, b) => {
      return b.onwardAngle - a.onwardAngle;
    });
    // console.log(lanes[stretchDef]);
  }
  // now that we have sorted the end lanes on each stretch, we can
  // assign those back into the route points:
  for (var routeName in routes) {
    for (var i=0; i<routes[routeName].length; i++) {
      // remember this now contains [lat, lon, stop_name, stretchDef-before]
      var stretchDef = routes[routeName][i][3];
      for (var j=0; j<lanes[stretchDef].length; j++) {
        if (lanes[stretchDef][j].routeName === routeName) {
          // lane index is 1-based
          // to make room for e.g. streetname in between left-driving
          // forward and oncoming lanes.
          // to each point, add the lane to be used at point
          // (end lane of previous stretch)
          routes[routeName][i].push(j + 1);
          // so it now contains [lat, lon, stop_name, stretchDef-before, lane]
          break;
        }
      }
    }
  }
}

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

function angle(before, here, after) {
  var normFirst = parallelVector(before[0], before[1], here[0], here[1]).map(coord => coord*LANE_FACTOR);
  var normSecond = parallelVector(here[0], here[1], after[0], after[1]).map(coord => coord*LANE_FACTOR);
  // FIXME: these aren't really angles.
  var firstAngle, secondAngle;
  if (normFirst[1] < 0) {
    firstAngle = -1 - normFirst[0]; // -1 -> 0; 0 -> -1; 1 -> -2
  } else {
    firstAngle = normFirst[0] + 1; // 1 -> 2; 0 -> 1; -1 -> 0
  }
  if (normSecond[1] < 0) {
    secondAngle = -1 - normSecond[0];
  } else {
    secondAngle = normSecond[0] + 1;
  }
  var diff = secondAngle - firstAngle;
  // FIXME: this doesn't really work linearly this way,
  // but for our purposes of ordering forward destinations
  // it's probably going to be good enough:
  if (diff < -2) {
    diff += 4;
  }
  if (diff > 2) {
    diff -= 4;
  }
  // console.log({ before, here, after, normFirst, normSecond, firstAngle, secondAngle, diff });
  return diff;
}

function lineThrough(a, b, lineLane) {
  // each of a and b contain:
  // [lat, lon, stop_name, stretchDef-before, lane]
  // a = [lat, lon] -> [y, x]
  // b = [lat, lon] -> [y, x]

  // console.log('line through', a, b, lineLane);
  var laneVector = perpendicularVector(a[1], a[0], b[1], b[0]);
  var preVector = parallelVector(a[1], a[0], b[1], b[0]);
  var middleX = (a[1] + b[1])/2;
  var middleY = (a[0] + b[0])/2;
  var switchStartBaseX = middleX - Math.abs(b[4]-a[4])*preVector[0];
  var switchStartBaseY = middleY - Math.abs(b[4]-a[4])*preVector[1];
  var switchEndBaseX = middleX + Math.abs(b[4]-a[4])*preVector[0];
  var switchEndBaseY = middleY + Math.abs(b[4]-a[4])*preVector[1];

  var fromX = a[1] + lineLane * laneVector[0];
  var fromY = a[0] + lineLane * laneVector[1];
  var switchStartX = switchStartBaseX + lineLane * laneVector[0];
  var switchStartY = switchStartBaseY + lineLane * laneVector[1];
  var switchEndX = switchEndBaseX + lineLane * laneVector[0];
  var switchEndY = switchEndBaseY + lineLane * laneVector[1];
  var toX = b[1] + lineLane * laneVector[0];
  var toY = b[0] + lineLane * laneVector[1];
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
  return 0;

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
  // console.log('makeCornerPoint', { routeName, before, here, after, debug});
  var cornerLane = getLaneAtPoint(here);
  var beforeLine = lineThrough(before, here, cornerLane);
  // lineThrough returns an object:
  //  start: [fromX, switchStartX-fromX, fromY, switchStartY-fromY],
  //  switcher: [switchStartX, switchEndX-switchStartX, switchStartY, switchEndY-switchStartY],
  //  end: [switchEndX, toX-switchEndX, switchEndY, toY-switchEndY],
  var afterLine = lineThrough(here, after, cornerLane);
  // each of before, here, after contains:
  // [lat, lon, stop_name, stretchDef-before, lane]
  var isEndPoint = (before[2].localeCompare(after[2]) === 0);
  // console.log(beforeLine, afterLine);
  return {
    coords: cutLines(beforeLine.end, afterLine.start, here),
    switcherLineBefore: beforeLine.switcher,
    isEndPoint,
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

module.exports = { lineThrough, assignLanesTo, traceRoute };
