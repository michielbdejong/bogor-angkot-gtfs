// packages
var fs = require('fs');
var points = require('./points');
var lines = require('./lines');
var lanes = require('./lanes');
var maps = require('./maps');

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

function drawMainMap() {
  var svg = maps.initDrawing();
  var texts = [];
  for (var routeName in routes) {
    if (ROUTE_COLOURS[routeName]) {
      var obj = maps.drawPath(
        routeName,
        ROUTE_COLOURS[routeName],
        lines.traceRoute(routes[routeName])
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
    lines.traceRoute(routes[routeName])
  );
  svg += obj.svgSnippet;
  svg += maps.finishDrawing(obj.texts, obj.debugLines);
  return svg;
}

// ...
var routes = points.readPoints();
lanes.assignLanesTo(/* by ref */ routes);

fs.writeFileSync('../release/map.svg', drawMainMap(routes));

for (var routeName in routes) {
  if (ROUTE_COLOURS[routeName]) {
    fs.writeFileSync(`../release/${routeName}.svg`, drawRouteMap(routeName));
  }
}
