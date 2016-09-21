// packages
var fs = require('fs');
var mathjs = require('mathjs');
var points = require('./points');

// constants
const MAP_WEST = 106.76;
const MAP_EAST = 106.865;
const MAP_NORTH = -6.50;
const MAP_SOUTH = -6.685;

const MAP_CENTER_LON = (MAP_WEST + MAP_EAST)/2;
const MAP_CENTER_LAT = (MAP_NORTH + MAP_SOUTH)/2;
const MAP_WIDTH = MAP_EAST - MAP_WEST;
const MAP_HEIGHT = MAP_NORTH - MAP_SOUTH;

const CANVAS_SCALE = 10000;
const CANVAS_WIDTH = MAP_WIDTH * CANVAS_SCALE;
const CANVAS_HEIGHT = MAP_HEIGHT * CANVAS_SCALE;
const MAP_ROTATION = 30;
const LANE_FACTOR = 5000;
const LANE_SWITCH_DIST = 10/LANE_FACTOR;
const TEXT_FACTOR = .1;
const STROKE_WIDTH = 2;
const TEXT_CIRCLE_SIZE = 15;
const TEXT_CIRCLE_UP = 6;
const TEXT_CIRCLE_LEFT = 0;
const ROUTE_COLOURS = {
  'AK-01': 'blue',
  'AK-02': 'orange',
  'AK-03': 'blue',
  'AK-04': 'blue',
  'AK-05': 'pink',
  'AK-06': 'yellow',
  'AK-07': 'lightgrey',
  'AK-08': 'red',
  'AK-09': 'purple',
  'AK-10': 'silver',
  'AK-11': 'brown',
  'AK-12': 'yellow',
  'AK-13': 'orange',
  'AK-14': 'pink',
  'AK-15': 'brown',
  'AK-16': 'lightgrey',
  'AK-17': 'grey',
  'AK-18': 'yellow',
  'AK-19': 'darkgreen',
  'AK-20': 'black',
  'AK-21': 'black',
  'AK-22': 'black',
  'AK-23': 'black',
};

const CANVAS_ATTR = [
  `width="${CANVAS_WIDTH}"`,
  `height="${CANVAS_HEIGHT}"`,
  `xmlns="http://www.w3.org/2000/svg"`,
  `xmlns:xlink="http://www.w3.org/1999/xlink"`,
];

// svg has its y axis upside down (i.e., (0,0 is in the top left),
// so put a minus sign in front of the y scale factor and the y translation.
// These transformations are applied in reverse order:
const TRANSFORMS = [
  // lastly, move the scaled, rotated center into the
  // center of the canvas
  `translate(${CANVAS_WIDTH/2} ${CANVAS_HEIGHT/2})`,
  // rotate the map around (0,0) to taste
  `rotate(${MAP_ROTATION})`,
  // scale it from lat/lon degrees to pixels
  `scale(${CANVAS_SCALE} -${CANVAS_SCALE})`,
  // first, center (0,0) on Bogor
  `translate(${-MAP_CENTER_LON} ${-MAP_CENTER_LAT})`,
];


const BOUNDING_BOX_PATH = [
  `M${MAP_WEST} ${MAP_NORTH}`,
  `L${MAP_EAST} ${MAP_NORTH}`,
  `L${MAP_EAST} ${MAP_SOUTH}`,
  `L${MAP_WEST} ${MAP_SOUTH}`,
  `Z`,
];

const BOUNDING_BOX_TRANSFORMATIONS = [
  `translate(${MAP_CENTER_LON} ${MAP_CENTER_LAT})`,
  `rotate(${MAP_ROTATION})`,
  `translate(${-MAP_CENTER_LON} ${-MAP_CENTER_LAT})`,
];

const BOUNDING_BOX_ATTR = [
  `d="${BOUNDING_BOX_PATH.join(' ')}"`,
  `fill="none"`,
  `stroke="black"`,
  `stroke-width="${5*STROKE_WIDTH/CANVAS_SCALE}"`,
  `transform="${BOUNDING_BOX_TRANSFORMATIONS.join(' ')}"`,
];

const SVG_PREFIX = `<svg ${CANVAS_ATTR.join(' ')} >\n` +
                   `  <g transform="${TRANSFORMS.join(' ')}">\n` +
                   `    <path ${BOUNDING_BOX_ATTR.join(' ')} />\n`;

const SVG_SUFFIX = `  </g>\n` +
                   `</svg>\n`;

// globals
var svg;
var texts;
var routes;
var cornerPoints = {};

// functions
function warp(x) {
  return x/100;
  // :
  if (x<0) {
    return -Math.sqrt(Math.abs(x));
  } else {
    return Math.sqrt(x);
  }
}

function makeTextTrans(x, y) {
  return [
    `translate(${x} ${y})`,
    `scale(${TEXT_FACTOR/CANVAS_SCALE} ${-TEXT_FACTOR/CANVAS_SCALE})`,
    `translate(${-x} ${-y})`,
    `translate(${MAP_CENTER_LON} ${MAP_CENTER_LAT})`,
    `rotate(${-MAP_ROTATION})`,
    `translate(${-MAP_CENTER_LON} ${-MAP_CENTER_LAT})`,
  ];
}

function drawPath(routeName, cornerPoints) {
  // console.log('drawPath', routeName, cornerPoints);
  var path = [];
  for (var i=0; i<cornerPoints.length; i++) {
    var [sXs, sXd, sYs, sYd] = cornerPoints[i].switcherLineBefore;
    var sXe = sXs + sXd;
    var sYe = sYs + sYd;
    var corner = cornerPoints[i].coords; // coords contains [x, y]
    path.push(`${sXs} ${sYs}`);
    path.push(`${sXe} ${sYe}`);
    path.push(`${corner[0]} ${corner[1]}`);
    if (cornerPoints[i].isEndPoint) {
      var textTrans = makeTextTrans(corner[0], corner[1]);
      var textAttr = [
        `x="${corner[0]}"`,
        `y="${corner[1]}"`,
        `fill="black"`,
        `text-anchor="middle"`,
        `transform="${textTrans.join(' ')}"`
      ];
      var textStr = routeName.substring(3);
      texts.push({ x: corner[0], y: corner[1], textTrans, textAttr, textStr});
    }
  }
  var attributes = `stroke="${ROUTE_COLOURS[routeName]}" stroke-width="${STROKE_WIDTH/CANVAS_SCALE}" fill="none"`;
  svg += `    <path d="M${path.join(' L')} Z" ${attributes} />\n`;
}

var lanes = {};

function assignLanes() {
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

var debugLines = [];
function makeCornerPoint(routeName, before, here, after, debug) {
  // console.log('makeCornerPoint', { routeName, before, here, after, debug});
  var cornerLane = getLaneAtPoint(here);
  var beforeLine = lineThrough(before, here, cornerLane);
  // lineThrough returns an object:
  //  start: [fromX, switchStartX-fromX, fromY, switchStartY-fromY],
  //  switcher: [switchStartX, switchEndX-switchStartX, switchStartY, switchEndY-switchStartY],
  //  end: [switchEndX, toX-switchEndX, switchEndY, toY-switchEndY],
  if (debug) {
    debugLines.push([before, here]);
  }
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
  };
}

function traceRoute(routeName, debug) {
  var cornerPoints = [];
  var points = routes[routeName];
  for (var i=0; i<points.length; i++) {
    cornerPoints.push(makeCornerPoint(
      routeName,
      points[i],
      points[(i+1) % points.length],
      points[(i+2) % points.length], debug));
  }
  return cornerPoints;
}

function initDrawing() {
  svg = SVG_PREFIX;
  texts = [];
  debugLines = [];
}

function finishDrawing() {
  svg += texts.map(obj => 
     `    <circle \n` +
     `      cx="${obj.x-TEXT_CIRCLE_LEFT}" cy="${obj.y-TEXT_CIRCLE_UP}"\n` +
     `      r="${TEXT_CIRCLE_SIZE}" transform="${obj.textTrans.join(' ')}"\n` +
     `      fill="white" stroke="black" stroke-width="2"/>`
  ).join('\n') + '\n';
  svg += texts.map(obj => 
     `    <circle \n` +
     `      cx="${obj.x-TEXT_CIRCLE_LEFT}" cy="${obj.y-TEXT_CIRCLE_UP}"\n` +
     `      r="${TEXT_CIRCLE_SIZE}" transform="${obj.textTrans.join(' ')}"\n` +
     `      fill="white" stroke="none"/>`
  ).join('\n') + '\n';
  svg += texts.map(obj => 
     `    <text ${obj.textAttr.join(' ')}>${obj.textStr}</text>`
  ).join('\n') + '\n';
  svg += debugLines.map(line => {
    var a = line[0];
    var b = line[1];
    var lines = lineThrough(a, b, 0);
    // lineThrough returns an object:
    //  start: [fromX, switchStartX-fromX, fromY, switchStartY-fromY],
    //  switcher: [switchStartX, switchEndX-switchStartX, switchStartY, switchEndY-switchStartY],
    //  end: [switchEndX, toX-switchEndX, switchEndY, toY-switchEndY],
    var [fromX1, deltaX1, fromY1, deltaY1] = lines.start;
    var [fromX2, deltaX2, fromY2, deltaY2] = lines.switcher;
    var [fromX3, deltaX3, fromY3, deltaY3] = lines.end;
    var toX1 = fromX1 + deltaX1;
    var toY1 = fromY1 + deltaY1;
    var toX2 = fromX2 + deltaX2;
    var toY2 = fromY2 + deltaY2;
    var toX3 = fromX3 + deltaX3;
    var toY3 = fromY3 + deltaY3;
    var textTrans = makeTextTrans(a[1], a[0]);

    return [
      `    <line x1="${a[1]}" y1="${a[0]}" x2="${b[1]}" y2="${b[0]}" style="stroke:rgb(255,0,0);stroke-width:.00002" />`,
      `    <line x1="${fromX1}" y1="${fromY1}" x2="${toX1}" y2="${toY1}" style="stroke:rgb(0,0,0);stroke-width:.00002" />`,
      `    <line x1="${fromX2}" y1="${fromY2}" x2="${toX2}" y2="${toY2}" style="stroke:rgb(0,0,0);stroke-width:.00002" />`,
      `    <line x1="${fromX3}" y1="${fromY3}" x2="${toX3}" y2="${toY3}" style="stroke:rgb(0,0,0);stroke-width:.00002" />`,
      `    <circle cx="${a[1]}" cy="${a[0]}" fill="rgb(255,0,0)" r=".0001" />`,
      `    <text x="${a[1]}" y="${a[0]}" stroke="rgb(0,0,0)" transform="${textTrans}" >${a[2]}</text>`,
    ].join('\n');
  }).join('\n') + '\n';
  svg += SVG_SUFFIX;
}

// ...
routes = points.readPoints();
assignLanes();

// draw map.svg
initDrawing();
for (var routeName in routes) {
  if (ROUTE_COLOURS[routeName]) {
    drawPath(routeName, traceRoute(routeName));
  }
}
finishDrawing();
fs.writeFileSync('../release/map.svg', svg);

// draw per-route maps
for (var routeName in routes) {
  if (ROUTE_COLOURS[routeName]) {
    initDrawing();
    drawPath(routeName, traceRoute(routeName, true), true);
    finishDrawing();
    fs.writeFileSync(`../release/${routeName}.svg`, svg);
  }
}

