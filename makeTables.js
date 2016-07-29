var fs = require('fs');

var joined = JSON.parse(fs.readFileSync('./build/joined.json'));
var coordEntries = fs.readFileSync('./coords.txt').toString().split('\n').map(line => line.split('\t'));
var coords = {};

for (var i=0; i<coordEntries.length; i++) {
  coords[coordEntries[i][2]] = coordEntries[i];
}

var stopsPerLine = {};

console.log('<!DOCTYPE html>\n<html><body>');
for (var lineNo in joined.routes) {
  var maxStops = 0;
  console.log('<h2>'+lineNo+'</h2><table><td>stop name</td><td>sources</td></tr>');
  for(var source in joined.routes[lineNo].stops) {
    if(joined.routes[lineNo].stops[source].length > maxStops) {
      maxStops = joined.routes[lineNo].stops[source].length;
    }
  }

  var stops = [];
  function addStop(stopName, source, index) {
    for (var j=0; j<stops.length; j++) {
      if (stops[j].name == stopName) {
        stops[j].sources.push(`${source}-${index}`);
        return;
      }
    }
    stops.push({ name: stopName, sources: [`${source}-${index}`] });
  }
  for(var i=0; i<maxStops; i++) {
    for(var source in joined.routes[lineNo].stops) {
      var stopsList = joined.routes[lineNo].stops[source];
      if (Array.isArray(stopsList) && stopsList.length > i) {
        addStop(stopsList[i], source, i);
      }
    }
  }
  for (var i=0; i<stops.length; i++) {
    console.log('<tr><td>'+stops[i].name+'</td><td>', stops[i].sources.join(', ') + '</td></tr>');
  }
  console.log('</table>');
}

console.log('</body></html>');
