var lines = require('./lines');

// constants
const MAP_WEST = 106.725;
const MAP_EAST = 106.87;
const MAP_NORTH = -6.515;
const MAP_SOUTH = -6.67;

const MAP_CENTER_LON = (MAP_WEST + MAP_EAST)/2;
const MAP_CENTER_LAT = (MAP_NORTH + MAP_SOUTH)/2;
const MAP_WIDTH = MAP_EAST - MAP_WEST;
const MAP_HEIGHT = MAP_NORTH - MAP_SOUTH;

const CANVAS_SCALE = 10000;
const CANVAS_WIDTH = MAP_WIDTH * CANVAS_SCALE;
const CANVAS_HEIGHT = MAP_HEIGHT * CANVAS_SCALE;
const MAP_ROTATION = 0;
const LANE_FACTOR = 5000;
const LANE_SWITCH_DIST = 10/LANE_FACTOR;
const TEXT_FACTOR = .15;
const STROKE_WIDTH = 1;
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

function makeTextTrans(basePoint, factor) {
  return [
    `translate(${basePoint[0]} ${basePoint[1]})`,
    `scale(${factor/CANVAS_SCALE} ${-factor/CANVAS_SCALE})`,
    `translate(${-basePoint[0]} ${-basePoint[1]})`,
    `translate(${MAP_CENTER_LON} ${MAP_CENTER_LAT})`,
    `rotate(${-MAP_ROTATION})`,
    `translate(${-MAP_CENTER_LON} ${-MAP_CENTER_LAT})`,
  ];
}

function makeTextAttr(basePoint, textTrans, textAnchor) {
  return [
    `x="${basePoint[0]}"`,
    `y="${basePoint[1]}"`,
    `fill="black"`,
    `text-anchor="${textAnchor}"`,
    `transform="${textTrans.join(' ')}"`
  ];
}

function drawPath(routeName, basics, cornerPoints) {
  // console.log('drawPath', routeName, basics, cornerPoints);
  var svgSnippet = '';
  var path = [];
  var debugLines = [];
  var texts = [];
  for (var i=0; i<cornerPoints.length; i++) {
    var [sXs, sXd, sYs, sYd] = cornerPoints[i].switcherLineBefore;
    var sXe = sXs + sXd;
    var sYe = sYs + sYd;
    // coords contains [x, y]
    var corner = cornerPoints[i].coords;
    // here contains [lat, lon, stop_name, stretchDef-before, lane]
    var basePoint = [cornerPoints[i].here[1], cornerPoints[i].here[0]];
    var pointName = cornerPoints[i].here[2];

    // console.log({ corner, basePoint });
    path.push(`${sXs} ${sYs}`);
    path.push(`${sXe} ${sYe}`);
    path.push(`${corner[0]} ${corner[1]}`);
    var textTrans = makeTextTrans(basePoint, TEXT_FACTOR);
    var textAttr = makeTextAttr(basePoint, textTrans, 'middle');
    var textStr = routeName.substring(3);
    texts.push({
      x: basePoint[0],
      y: basePoint[1],
      textTrans,
      textAttr,
      textStr,
      pointName,
    });
    debugLines.push(cornerPoints[i].debugLine);
  }
  var attributes = `stroke="${basics.color}" stroke-width="${STROKE_WIDTH/CANVAS_SCALE}" fill="none"`;
  svgSnippet += `    <path d="M${path.join(' L')} Z" ${attributes} />\n`;
  return { svgSnippet, texts, debugLines };
}

function drawArrow(obj) {
  if (typeof obj === 'undefined') {
    // stretch without arrow
    return '';
  }
  // arrow contains inside, tip, outside, each of which are [x, y];
  var path = [ obj.inside, obj.tip, obj.outside ];
  var attributes = `stroke="none" fill="black"`;
  return `    <path d="M${path.join(' L')} Z" ${attributes} />\n`;
}

function initDrawing() {
  return SVG_PREFIX;
}

function finishDrawing(texts, debugLines) {
  var groupedTexts = {};
  var point; // let not supported outside strict-mode
  for (var i=0; i<texts.length; i++) {
    point = `${texts[i].x},${texts[i].y}`;
    if (typeof groupedTexts[point] === 'undefined') {
      groupedTexts[point] = texts[i];
      groupedTexts[point].size = 1;
    } else if (groupedTexts[point].textStr.indexOf(texts[i].textStr) === -1) {
      groupedTexts[point].textStr += ', ' + texts[i].textStr;
      groupedTexts[point].size++;
    }
  }
  var svgSnippet = '';
  for (point in groupedTexts) {
    var obj = groupedTexts[point];
    // console.log(obj);
    if (obj.pointName.substring(0, 1) !== '#') {
      if (obj.pointName.substring(0, 1) === '*') {
        obj.textStr += ` ${obj.pointName.substring(1).trim()}`;
        obj.size += obj.pointName.length/3;
      }
      svgSnippet += `    <ellipse \n` +
       `      cx="${obj.x-TEXT_CIRCLE_LEFT}" cy="${obj.y-TEXT_CIRCLE_UP}"\n` +
       `      rx="${TEXT_CIRCLE_SIZE*obj.size}" ry="${TEXT_CIRCLE_SIZE}" transform="${obj.textTrans.join(' ')}"\n` +
       `      fill="white" stroke="black" stroke-width="2"/>\n` +
       `    <text ${obj.textAttr.join(' ')}>${obj.textStr}</text>\n`;
    }
  }
  svgSnippet += debugLines.map(line => {
    var a = line[0];
    var b = line[1];
    var lineParts = lines.lineThrough(a, b);
    // lineThrough returns an object:
    //  start: [fromX, switchStartX-fromX, fromY, switchStartY-fromY],
    //  switcher: [switchStartX, switchEndX-switchStartX, switchStartY, switchEndY-switchStartY],
    //  end: [switchEndX, toX-switchEndX, switchEndY, toY-switchEndY],
    var [fromX1, deltaX1, fromY1, deltaY1] = lineParts.start;
    var [fromX2, deltaX2, fromY2, deltaY2] = lineParts.switcher;
    var [fromX3, deltaX3, fromY3, deltaY3] = lineParts.end;
    var toX1 = fromX1 + deltaX1;
    var toY1 = fromY1 + deltaY1;
    var toX2 = fromX2 + deltaX2;
    var toY2 = fromY2 + deltaY2;
    var toX3 = fromX3 + deltaX3;
    var toY3 = fromY3 + deltaY3;
    var textTrans = makeTextTrans(a[1], a[0]);

    return [
      // `    <line x1="${a[1]}" y1="${a[0]}" x2="${b[1]}" y2="${b[0]}" style="stroke:rgb(255,255,0);stroke-width:.00002" />`,
      `    <line x1="${fromX1}" y1="${fromY1}" x2="${toX1}" y2="${toY1}" style="stroke:rgb(255,0,0);stroke-width:.00002" />`,
      // `    <line x1="${fromX2}" y1="${fromY2}" x2="${toX2}" y2="${toY2}" style="stroke:rgb(0,255,0);stroke-width:.00002" />`,
      `    <line x1="${fromX3}" y1="${fromY3}" x2="${toX3}" y2="${toY3}" style="stroke:rgb(0,0,255);stroke-width:.00002" />`,
      `    <circle cx="${a[1]}" cy="${a[0]}" fill="rgb(255,0,0)" r=".0001" />`,
      `    <text x="${a[1]}" y="${a[0]}" stroke="rgb(0,0,0)" transform="${textTrans}" >${a[2]}</text>`,
    ].join('\n');
  }).join('\n') + '\n';
  svgSnippet += SVG_SUFFIX;
  return svgSnippet;
}

module.exports = {
  drawArrow,
  drawPath,
  finishDrawing,
  initDrawing,
  makeTextAttr,
  makeTextTrans,
};
