var fs = require('fs');

var joined = JSON.parse(fs.readFileSync('./build/joined.json'));
for (var lineNo in joined.routes) {
  console.log(`<h2>${lineNo}</h2><canvas id="canvas-${lineNo}" width="1000" height="1000" style="border:1px solid #000000;"></canvas>`);
}
