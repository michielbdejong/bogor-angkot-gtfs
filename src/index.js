// packages
var fs = require('fs');
var points = require('./points');
var maps = require('./maps');

const ROUTE_COLOURS = {
  'AK-21': 'blue',
  'AK-22': 'orange',
  'AK-23': 'red',
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
    if (ROUTE_COLOURS[routeName]) {
      var obj = maps.drawPath(
        routeName,
        ROUTE_COLOURS[routeName],
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
    ROUTE_COLOURS[routeName],
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
  if (ROUTE_COLOURS[routeName]) {
    fs.writeFileSync(`../release/${routeName}.svg`, drawRouteMap(routeName));
  }
}
