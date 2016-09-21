// packages
var fs = require('fs');
var points = require('./points');
var maps = require('./maps');

const ROUTE_BASICS = {
  'AK-01': { color: 'blue', destinations: [] },
  'AK-02': { color: '#8D0908', destinations: ['Sukasari', 'Bubulak'] },
  'AK-03': { color: 'blue', destinations: [] },
  'AK-04': { color: 'blue', destinations: [] },
  'AK-05': { color: 'pink', destinations: [] },
  'AK-06': { color: '#968417', destinations: [] },
  'AK-07': { color: '#A7AEDA', destinations: ['Ciparigi', 'Terminal Merdeka'] },
  'AK-08': { color: 'red', destinations: [] },
  'AK-09': { color: '#430082', destinations: ['Ciparigi', 'Sukasari'] },
  'AK-10': { color: 'silver', destinations: [] },
  'AK-11': { color: 'brown', destinations: [] },
  'AK-12': { color: 'yellow', destinations: [] },
  'AK-13': { color: '#A30015', destinations: [] },
  'AK-14': { color: '#FF00E4', destinations: [] },
  'AK-15': { color: 'brown', destinations: [] },
  'AK-16': { color: 'lightgrey', destinations: [] },
  'AK-17': { color: '#8D6988', destinations: ['Pomad', 'Tanah Baru', 'Binamarga'] },
  'AK-18': { color: '#563D00', destinations: ['Ramayana', 'Mulyaharja'] },
  'AK-19': { color: '#211F20', destinations: [] },
  'AK-20': { color: '#2E585A', destinations: ['Pasar Anyar', 'Taman Griya Kencana'] },
  'AK-21': { color: '#3959CA', destinations: ['Baranangsiang', 'Ciawi'] },
  'AK-22': { color: 'black', destinations: [] },
  'AK-23': { color: 'black', destinations: [] },
};         
           
function traceRoute(points) {
  var cornerPoints = [];
  for (var i=0; i<points.length; i++) {
    var before = points[i];
    var here = points[(i+1) % points.length];
    cornerPoints.push({
      coords: [here[1], here[0]],
      isEndPoint: false,
      here,
      debugLine: [before, here],
    });
  }
  return cornerPoints;
}

function drawMainMap() {
  var svg = maps.initDrawing();
  var texts = [];
  for (var routeName in routes) {
    if (ROUTE_BASICS[routeName]) {
      var obj = maps.drawPath(
        routeName,
        ROUTE_BASICS[routeName],
        traceRoute(routes[routeName])
      );
      svg += obj.svgSnippet;
      texts = texts.concat(obj.texts);
    }
  }
  svg += maps.finishDrawing(texts, []);
  return svg;
}

function drawRouteMap(routeName) {
  var svg = maps.initDrawing();
  var obj = maps.drawPath(
    routeName,
    ROUTE_BASICS[routeName],
    traceRoute(routes[routeName])
  );
  svg += obj.svgSnippet;
  svg += maps.finishDrawing(obj.texts, obj.debugLines);
  return svg;
}

// ...
var routes = points.readPoints();

fs.writeFileSync('../release/map.svg', drawMainMap(routes));

for (var routeName in routes) {
  if (ROUTE_BASICS[routeName]) {
    fs.writeFileSync(`../release/${routeName}.svg`, drawRouteMap(routeName));
  }
}
