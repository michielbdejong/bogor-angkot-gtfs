// packages
var fs = require('fs');
var mathjs = require('mathjs');

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
const NAME_COL = 0;
const LAT_COL = 1;
const LON_COL = 2;
const STOP_COL = 5;
const LANE_FACTOR = 2500;
const STROKE_WIDTH = 5;
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
var routes = {};
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

function drawPath(routeName, cornerPoints) {
  // console.log('drawPath', routeName, cornerPoints);
  var path = [];
  for (var i=0; i<cornerPoints.length; i++) {
    var x = cornerPoints[i].coords[0];
    var y = cornerPoints[i].coords[1];
    path.push(`${x} ${y}`);
    if (cornerPoints[i].lanesChange || cornerPoints[i].isEndPoint) {
      var textTrans = [
        `translate(${x} ${y})`,
        `scale(${.15/CANVAS_SCALE} ${-.15/CANVAS_SCALE})`,
        `translate(${-x} ${-y})`,
        `translate(${MAP_CENTER_LON} ${MAP_CENTER_LAT})`,
        `rotate(${-MAP_ROTATION})`,
        `translate(${-MAP_CENTER_LON} ${-MAP_CENTER_LAT})`,
      ];
  
      var textAttr = [
        `x="${x}"`,
        `y="${y}"`,
        `fill="black"`,
        `text-anchor="middle"`,
        `transform="${textTrans.join(' ')}"`
      ];
      var textStr = routeName.substring(3);
      texts.push({ x, y, textTrans, textAttr, textStr});
    }
  }
  var attributes = `stroke="${ROUTE_COLOURS[routeName]}" stroke-width="${STROKE_WIDTH/CANVAS_SCALE}" fill="none"`;
  svg += `    <path d="M${path.join(' L')} Z" ${attributes} />\n`;
}

function readPoints() {
  var firstLine = true;
  fs.readFileSync('./manual-from-transitwand/kota/shapes.txt').toString().split('\n').map(line => {
  // fs.readFileSync('./test/shapes.txt').toString().split('\n').map(line => {
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
      columns[STOP_COL],
    ]);
  });
}

var lanes = {};

function assignLanes() {
  for (var routeName in routes) {
    for (var i=0; i<routes[routeName].length; i++) {
      var stretchDef = [
        routes[routeName][i][0],
        routes[routeName][i][1],
        routes[routeName][(i+1) % routes[routeName].length][0],
        routes[routeName][(i+1) % routes[routeName].length][1],
      ].join(',');
      if (typeof lanes[stretchDef] === 'undefined') {
        lanes[stretchDef] = [];
      }
      lanes[stretchDef].push(routeName);
      var lane = lanes[stretchDef].length;
      // lane index is 1-based
      // to make room for e.g. streetname in between left-driving forward and
      // oncoming lanes.
      // to each point, add the lane to be used after that point
      routes[routeName][i].push(lane);
      routes[routeName][i].push(stretchDef);
    }
  }
}

function perpendicularVector(fromX, fromY, toX, toY) {
  var distance = mathjs.distance([fromX, fromY], [toX, toY]);
  if (distance === 0) {
    return [0, 0];
  }
  var normalized = [(toX-fromX)/(LANE_FACTOR*distance), (toY-fromY)/(LANE_FACTOR*distance)];
  return [-normalized[1], normalized[0]];
}

function lineThrough(a, b) {
  // a = [lat, lon] -> [y, x]
  // b = [lat, lon] -> [y, x]

  // console.log('line through', a, b);
  var numLanes = a[3];
  var laneVector = perpendicularVector(a[1], a[0], b[1], b[0]);
  var fromX = a[1] + numLanes * laneVector[0];
  var fromY = a[0] + numLanes * laneVector[1];
  var toX = b[1] + numLanes * laneVector[0];
  var toY = b[0] + numLanes * laneVector[1];
  // two points define a line
  //      fix x, var x,    fix y, var y
  return [fromX, toX-fromX, fromY, toY-fromY];
}

function cutLines(a, b, fallbackCoords) {
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

function makeCornerPoint(routeName, before, here, after) {
  var beforeLine = lineThrough(before, here);
  var afterLine = lineThrough(here, after);
  // each of before, here, after contains:
  // [x, y, stop_name, lane, stretchDef-starting]
  var lanesBefore = lanes[before[4]].join(',');
  var lanesAfter = lanes[here[4]].join(',');
  // if (lanesBefore.localeCompare(lanesAfter) !== 0) {
  //   console.log(before[2].trim(), here[2].trim(), lanes[before[4]], here[2].trim(), after[2].trim(), lanes[here[4]]);
  // }
  var isEndPoint = (before[2].localeCompare === 0);
  return {
    coords: cutLines(beforeLine, afterLine, here),
    lanesChange: lanesBefore.localeCompare(lanesAfter) !== 0,
    isEndPoint,
    here,
  };
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
  return cornerPoints;
}

readPoints();
assignLanes();

// draw map.svg
function initDrawing() {
  svg = SVG_PREFIX;
  texts = [];
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
  svg += SVG_SUFFIX;
}

initDrawing();
for (var routeName in routes) {
  if (ROUTE_COLOURS[routeName]) {
    drawPath(routeName, traceRoute(routeName));
  }
}
finishDrawing();
fs.writeFileSync('./release/map.svg', svg);

// draw per-route maps
for (var routeName in routes) {
  if (ROUTE_COLOURS[routeName]) {
    initDrawing();
    drawPath(routeName, traceRoute(routeName));
    finishDrawing();
    fs.writeFileSync(`./release/${routeName}.svg`, svg);
  }
}

