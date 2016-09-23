var maps = require('./maps');

const LEGENDA_TOP = -6.62;
const LEGENDA_LEFT = 106.73;
const LEGENDA_LINE_HEIGHT = 0.002;
const LEGENDA_SCALE_FACTOR = 1.0;

const DID_YOU_KNOW = [
  'Hail to hop on, say "Kiri!" (which means "left"/"pull over") to hop off',
  'You usually see one within 2 or 3 minutes (only line 20 is less frequent)',
  'Price is Rp.3500 (~ 0.25 US$) for one ride in one direction (or Rp.2500 for students)',
  'Angkots may customize their route depending on the passengers',
  'Wait times at end-points can be long',
  'Waiting for enough passengers is called "mengetem" in Jakarta slang',
  'Lines 07 and 09 are supposed to go "Ciparigi", and lines 08 and 23 are supposed to go to "Wr. Jambu", but at Jambu Dua they usually ask you where you are going and if you want to get off), make a U-turn, and start their mengetem ritual',
  'Lines 07 and 10 are supposed to go Term. Merdeka, but usually turn around at Pasar Anyar',
  'Bogor has several "Ramayana" shops, but on angkots this destination means Bogor Trade Mall (BTM)',
  'Empty angkots can be chartered, e.g. to take you and 2 bicycles somewhere',
  'Angkot drivers may decide to take a shortcut to avoid traffic',
  'Especially Jl Paledang instead of Jl Muslihat is popular during the day',
  'Don\'t confuse "Taman Griya Kencana" (lines 19, 20) with "Taman Kencana" (lines 23, 03, and sometimes also 08 or 09 if they take the Jl Salak shortcut instead of Jl Pangrango)',
  'They may also decide to turn around early if empty, or extend their route',
  'If an angkot finishes their shift, you can get off without paying',
];

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
