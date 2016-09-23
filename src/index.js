// packages
var fs = require('fs');
var points = require('./points');
var lines = require('./lines');
var lanes = require('./lanes');
var maps = require('./maps');
var legenda = require('./legenda');

const ROUTE_BASICS = {
  'AK-01': { color: 'blue', destinations: ['Term. Merdeka', 'Cipaku', 'Cipinang Gading'] },
  'AK-02': { color: '#8D0908', destinations: ['Sukasari', 'Term. Bubulak'] },
  'AK-03': { color: 'blue', destinations: ['Term. Bubulak', 'Term. Baranangsiang'] },
  'AK-04': { color: 'blue', destinations: ['Warung Nangka', 'Rancamaya', 'Ramayana'] },
  'AK-05': { color: 'pink', destinations: ['Cimahpar', 'Ramayana'] },
  'AK-06': { color: '#968417', destinations: ['Cileuheut', 'Ramayana'] },
  'AK-07': { color: '#A7AEDA', destinations: ['Ciparigi', 'Term. Merdeka'] },
  'AK-08': { color: 'red', destinations: ['Warung Jambu', 'Ramayana'] },
  'AK-09': { color: '#430082', destinations: ['Ciparigi', 'Sukasari'] },
  'AK-10': { color: 'silver', destinations: ['Bantar Kemang', 'Sukasari', 'Term. Merdeka'] },
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
  'AK-22': { color: 'black', destinations: ['Pasar Anyar', 'Pondok Rumput'], aka: '07A' },
  'AK-23': { color: 'black', destinations: ['Ramayana', 'Taman Kencana', 'Warung Jambu'], aka: '08A' },
};

function drawMap(routesInMap, routesToDraw, drawDebugLines) {
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
  svg += maps.finishDrawing(texts, debugLines);
  return svg;
}

// ...
var routes = points.readPoints();
lanes.assignLanesTo(/* by ref */ routes);

fs.writeFileSync('../release/map.svg', drawMap(routes, Object.keys(routes), false));

for (var routeName in routes) {
  if (ROUTE_BASICS[routeName]) {
    fs.writeFileSync(`../release/${routeName}.svg`, drawMap(routes, [ routeName ], true));
  }
}
