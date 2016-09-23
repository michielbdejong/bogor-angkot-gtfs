// packages
var lines = require('./lines');

// functions
function angle(before, here, after) {
  var normFirst = lines.parallelVector(before[0], before[1], here[0], here[1]).map(coord => coord*lines.LANE_FACTOR);
  var normSecond = lines.parallelVector(here[0], here[1], after[0], after[1]).map(coord => coord*lines.LANE_FACTOR);
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

  return lanes;
}

module.exports = { assignLanesTo };
