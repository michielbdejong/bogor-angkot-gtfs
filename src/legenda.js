var maps = require('./maps');

const DYK_TOP = -6.60;
const DYK_LEFT = 106.727;
const LEGENDA_TOP = -6.52;
const LEGENDA_LEFT = 106.8265;
const LEGENDA_LINE_HEIGHT = 0.002;
const LEGENDA_SCALE_FACTOR = 1.0;
const ICON_UP = -.1;
const TEXT_TO_RIGHT = 1.8;

const DID_YOU_KNOW = [
  'It\'s Raining Angkots in Bogor!',
  '',
  'This is a zoomable map of mini-buses in Bogor (West Java, Indonesia),',
  'a.k.a. Kota Hujan (City of Rain), a.k.a. Kota Seribu Angkot (City of a Thousand Minibuses).',
  'To zoom in, hold the Ctrl key down and then hit "+" (see "View" menu of your browser).',
  '',
  'This map only shows the central angkots ("Angutan Kota"), which are green at the top, and',
  'have one other color at the bottom indicating their route; not the regional minibuses',
  '("Angutan Perkotaan") which are either entirely green, or dark blue.',
  '',
  'To hop on anywhere, just hail an angkot with the right route number, in the right direction.',
  'You usually see one within 2 or 3 minutes (only line 20 is less frequent).',
  '',
  'To hop off, say "Kiri!" (which means "left"/"pull over")',
  'Get out through the tiny door first, then pay the driver through the window; both are always open.',
  'The price is Rp.3500 (~ 0.25 US$) for one ride in one direction (or Rp.2500 for students).',
  '',
  'Angkots may customize their route depending on where passengers need to go.',
  'Wait times at end-points can be long if the angkot is not full yet - waiting for enough',
  'passengers before driving off is called "mengetem" in Jakarta slang.',
  '',
  'Bogor has several "Ramayana" shops, but on angkots this destination means Bogor Trade',
  'Mall (BTM). Lines 07 and 09 are supposed to go "Ciparigi", and lines 08 and 23 are',
  'supposed to go to "Wr. Jambu", but at Jambu Dua they usually ask you where you are going and if',
  'you want to get off, then make a U-turn, and start their mengetem ritual for the route back.',
  'Also, lines 07 and 10 are supposed to go Term. Merdeka, but usually turn around at Pasar Anyar.',
  '',
  'Angkot drivers may decide to take a shortcut to avoid traffic - especially taking Jl. Paledang instead of Jl. Muslihat',
  'is popular during the day. Don\'t confuse "Taman Griya Kencana" of lines 19, 20 with "Taman Kencana" of lines 23',
  'and 03 (and sometimes also 08 or 09 if they take the Jl. Salak shortcut instead of Jl. Pangrango).',
  '',
  'Empty angkots can be chartered, e.g. negotiate a price to take you and 2 bicycles somewhere!',
  '',
  'I made this map by putting GPS coordinates into scalable vector graphics (SVG). The route data is also available in gtfs format, and you are free to remix it under',
  'Creative Commons (CC-BY-SA 3.0). Corrections and improvements are also very welcome! Email michiel@unhosted.org, or see the github repo: https://github.com/michielbdejong/bogor-angkot-gtfs.'
];


function getLegenda(routeBasics) {
  var snippet = '';
  var counter = 0;
  for (var routeName in routeBasics) {
    var basePoint = [LEGENDA_LEFT + TEXT_TO_RIGHT*LEGENDA_LINE_HEIGHT, (LEGENDA_TOP - counter*LEGENDA_LINE_HEIGHT)];
    var iconPoint = [LEGENDA_LEFT, (LEGENDA_TOP - (counter-ICON_UP)*LEGENDA_LINE_HEIGHT)];
    var textTrans = maps.makeTextTrans(basePoint, LEGENDA_SCALE_FACTOR);
    var iconTrans = maps.makeTextTrans(iconPoint, LEGENDA_SCALE_FACTOR);
    var textAttr = maps.makeTextAttr(basePoint, textTrans, 'left', 'normal', '12');
    var obj = routeBasics[routeName];
    snippet += maps.drawIcon(iconTrans, iconPoint, routeBasics[routeName].color);
    snippet += `    <text ${textAttr.join(' ')}>\n` +
     `        ${routeName.substring(3)}${(typeof obj.aka === 'undefined'?'':' (a.k.a. '+obj.aka+')')}:\n` +
     `        ${obj.destinations.join(' - ')}\n` +
     `        </text>\n`;
    counter++;
  }

  counter = 0;
  for (var i=0; i<DID_YOU_KNOW.length; i++) {
    basePoint = [DYK_LEFT, (DYK_TOP - (counter++)*LEGENDA_LINE_HEIGHT)];
    textTrans = maps.makeTextTrans(basePoint, LEGENDA_SCALE_FACTOR);
    if (i === 0) {
      textAttr = maps.makeTextAttr(basePoint, textTrans, 'left', 'bold', '24');
    } else {
      textAttr = maps.makeTextAttr(basePoint, textTrans, 'left', 'normal', '12');
    }
    snippet += 
     `    <text ${textAttr.join(' ')}>\n` +
     `        ${DID_YOU_KNOW[i]}\n` +
     `        </text>\n`;
  }
  return snippet;
}

module.exports = { getLegenda };
