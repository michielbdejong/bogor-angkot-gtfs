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

function drawPath(routeName, basics, cornerPoints) {
  // console.log('drawPath', routeName, basics, cornerPoints);
  var svgSnippet = '';
  var path = [];
  var debugLines = [];
  var texts = [];
  for (var i=0; i<cornerPoints.length; i++) {
    var corner = cornerPoints[i].coords; // coords contains [x, y]
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
    debugLines.push(cornerPoints[i].debugLine);
  }
  var attributes = `stroke="${basics.color}" stroke-width="${STROKE_WIDTH/CANVAS_SCALE}" fill="none"`;
  svgSnippet += `    <path d="M${path.join(' L')} Z" ${attributes} />\n`;
  return { svgSnippet, texts, debugLines };
}

function initDrawing() {
  return SVG_PREFIX;
}

function finishDrawing(texts, debugLines) {
  var svgSnippet = texts.map(obj => 
     `    <circle \n` +
     `      cx="${obj.x-TEXT_CIRCLE_LEFT}" cy="${obj.y-TEXT_CIRCLE_UP}"\n` +
     `      r="${TEXT_CIRCLE_SIZE}" transform="${obj.textTrans.join(' ')}"\n` +
     `      fill="white" stroke="black" stroke-width="2"/>`
  ).join('\n') + '\n';
  svgSnippet += texts.map(obj => 
     `    <circle \n` +
     `      cx="${obj.x-TEXT_CIRCLE_LEFT}" cy="${obj.y-TEXT_CIRCLE_UP}"\n` +
     `      r="${TEXT_CIRCLE_SIZE}" transform="${obj.textTrans.join(' ')}"\n` +
     `      fill="white" stroke="none"/>`
  ).join('\n') + '\n';
  svgSnippet += texts.map(obj => 
     `    <text ${obj.textAttr.join(' ')}>${obj.textStr}</text>`
  ).join('\n') + '\n';
  svgSnippet += debugLines.map(line => {
    var a = line[0];
    var b = line[1];
    // convert from [lon, lat] to [x, y] (x = lat = horizontal; y = lon = vertical)
    var fromX = a[1];
    var fromY = a[0];
    var toX = b[1];
    var toY = b[0];
    var textTrans = makeTextTrans(a[1], a[0]);

    return [
      `    <line x1="${a[1]}" y1="${a[0]}" x2="${b[1]}" y2="${b[0]}" style="stroke:rgb(255,0,0);stroke-width:.00002" />`,
      `    <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" style="stroke:rgb(0,0,0);stroke-width:.00002" />`,
      `    <circle cx="${a[1]}" cy="${a[0]}" fill="rgb(255,0,0)" r=".0001" />`,
      `    <text x="${a[1]}" y="${a[0]}" stroke="rgb(0,0,0)" transform="${textTrans}" >${a[2]}</text>`,
    ].join('\n');
  }).join('\n') + '\n';
  svgSnippet += SVG_SUFFIX;
  return svgSnippet;
}

module.exports = { initDrawing, drawPath, finishDrawing };
