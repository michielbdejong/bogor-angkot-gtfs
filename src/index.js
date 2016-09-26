// packages
var fs = require('fs');
var points = require('./points');
var lines = require('./lines');
var lanes = require('./lanes');
var maps = require('./maps');
var legenda = require('./legenda');

const ROUTE_BASICS = {
  'AK-01': { color: '#73BBFF', destinations: ['Term. Merdeka', 'Cipaku', 'Cipinang Gading'] },
  'AK-02': { color: '#8D0908', destinations: ['Sukasari', 'Term. Bubulak'] },
  'AK-03': { color: '#0197BB', destinations: ['Term. Bubulak', 'Term. Baranangsiang'] },
  'AK-04': { color: 'blue', destinations: ['Warung Nangka', 'Rancamaya', 'Ramayana'] },
  'AK-05': { color: '#D094C9', destinations: ['Cimahpar', 'Ramayana'] },
  'AK-06': { color: '#968417', destinations: ['Cileuheut', 'Ramayana'] },
  'AK-07': { color: '#A7AEDA', destinations: ['Ciparigi', 'Term. Merdeka'] },
  'AK-07A': { color: '#A7AEDA', destinations: ['Ciparigi', 'Ramayana'] },
  'AK-08': { color: '#6B112E', destinations: ['Ramayana', 'Indra Prasta', 'Warung Jambu'] },
  'AK-09': { color: '#6D5099', destinations: ['Ciparigi', 'Sukasari'] },
  'AK-10': { color: '#B6B1B8', destinations: ['Bantar Kemang', 'Sukasari', 'Term. Merdeka'] },
  'AK-11': { color: 'brown', destinations: ['Pajajaran Indah', 'Pasar Bogor'] },
  'AK-12': { color: 'yellow', destinations: ['Cimanggu', 'Pasar Anyar'] },
  'AK-13': { color: '#A30015', destinations: ['Ramayana', 'Bantar Kemang', 'Mutiara Bogor Raya'] },
  'AK-14': { color: '#FF00E4', destinations: ['Sukasari', 'Term. Bubulak'] },
  'AK-15': { color: 'brown', destinations: ['Term. Merdeka', 'Term. Bubulak', 'Sindang Barang Jero'] },
  'AK-16': { color: 'lightgrey', destinations: ['Pasar Anyar', 'Salabenda'] },
  'AK-17': { color: '#8D6988', destinations: ['Pomad', 'Tanah Baru', 'Bina Marga'] },
  'AK-18': { color: '#563D00', destinations: ['Ramayana', 'Mulyaharja'] },
  'AK-19': { color: '#211F20', destinations: ['Term. Bubulak', 'Taman Griya Kencana'] },
  'AK-20': { color: '#2E585A', destinations: ['Pasar Anyar', 'Taman Griya Kencana'] },
  'AK-21': { color: '#3959CA', destinations: ['Term. Baranangsiang', 'Ciawi'], aka: '01A' },
  'AK-22': { color: '#FFFEFC', destinations: ['Pasar Anyar', 'Pondok Rumput'] },
  'AK-23': { color: '#9A919A', destinations: ['Ramayana', 'Taman Kencana', 'Warung Jambu'], aka: '08A' },
};

function drawMap(routesInMap, arrowsInMap, routesToDraw, drawDebugLines) {
  var svg = maps.initDrawing();
  var texts = [];
  var debugLines = [];
  for (var routeName in routesInMap) {
    if (ROUTE_BASICS[routeName]) {
      var obj = maps.drawPath(
        routeName,
        ROUTE_BASICS[routeName], // global
        lines.traceRoute(routesInMap[routeName])
      );
      texts = texts.concat(obj.texts); // always draw all texts
      if (routesToDraw.indexOf(routeName) !== -1) {
        svg += obj.svgSnippet;
        if (drawDebugLines) {
          debugLines = debugLines.concat(obj.debugLines);
        }
      }
    }
  }
  svg += legenda.getLegenda(ROUTE_BASICS);
  arrows.map(arrow => { svg += maps.drawArrow(arrow); });
  svg += maps.finishDrawing(texts, debugLines);
  return svg;
}

function makeArrows(lanes) {
  var arrows = [];
  for (var stretchDef in lanes) {
    var [fromLat, fromLon, toLat, toLon] = stretchDef.split(',');
    arrows.push(lines.makeArrow(
      [parseFloat(fromLat), parseFloat(fromLon)],
      [parseFloat(toLat), parseFloat(toLon)],
      lanes[stretchDef].length
    ));
  }
  return arrows;
}

// ...
var routes = points.readPoints();
var lanes = lanes.assignLanesTo(/* by ref */ routes);
var arrows = makeArrows(lanes);

fs.writeFileSync('../release/map.svg', drawMap(routes, arrows, Object.keys(routes), false));

for (var routeName in routes) {
  if (ROUTE_BASICS[routeName]) {
    fs.writeFileSync(`../release/${routeName}.svg`, drawMap(routes, arrows, [ routeName ], true));
  }
}
