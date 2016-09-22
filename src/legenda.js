var maps = require('./maps');

const LEGENDA_TOP = -6.62;
const LEGENDA_LEFT = 106.73;
const LEGENDA_LINE_HEIGHT = 0.002;
const LEGENDA_SCALE_FACTOR = 1.0;

function getLegenda(routeBasics) {
  var snippet = '';
  var counter = 0;
  for (var routeName in routeBasics) {
    var basePoint = [LEGENDA_LEFT, (LEGENDA_TOP - (counter++)*LEGENDA_LINE_HEIGHT)];
    var textTrans = maps.makeTextTrans(basePoint, LEGENDA_SCALE_FACTOR);
    var textAttr = maps.makeTextAttr(basePoint, textTrans, 'left');
    var obj = routeBasics[routeName];
    snippet += 
     `    <text ${textAttr.join(' ')}>\n` +
     `        ${routeName}${(typeof obj.aka === 'undefined'?'':' (a.k.a. '+obj.aka+')')}:\n` +
     `        ${obj.destinations.join(' - ')}\n` +
     `        </text>\n`;
  }
  return snippet;
}

module.exports = { getLegenda };
