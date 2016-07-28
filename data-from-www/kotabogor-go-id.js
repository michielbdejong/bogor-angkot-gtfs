// http://kotabogor.go.id/index.php/rute

var columns = ['#', 'Jenis Angkutan', 'Jenis Trayek', 'Nomor Trayek', 'Nama Trayek', 'Rute Berangkat', 'Rute Kembali'];
var raw = [
  '1 	Bus 	Metromini 	bus1	Depok - Bogor 	Depok Timur - Simpangan Depok - Cilodong - Cilangkap - Cibinong - Pomad - Kedung Halang - Jambu Dua - Pajajaran - Terminal Baranangsiang 	Terminal Baranangsiang - Pajajaran - Jambu Dua - Kedung Halang - Pomad - Cibinong - Cilangkap - Cilodong - Simpangan Depok - Depok Timur',
  '2 	Bus 	Metromini 	bus2	Kp. Rambutan - Bogor 	Terminal Kp. Rambutan - Ps. Rebo - Pal - Gandaria - Simpangan Depok - Cilodong - Cilangkap - Cibinong - Pomad - Kedung Halang - Jambu Dua - Pajajaran - Terminal Baranangsiang 	Terminal Baranangsiang - Pajajaran - Jambu Dua - Kedung Halang - Pomad - Cibinong - CIlangkap - Cilodong - Simpangan Depok - Gandaria - Pal - Ps. Rebo - Terminal Kp. Rambutan',
  '3 	Angkot 	- 	17 	Tanah Baru - Pomad 	Tanahbaru – Kampus ST Kimia Analisis – Pomad 	Pomad - Kampus ST Kimia Analisis - Tanahbaru',
  '4 	Angkot 	- 	16 	Salabenda - Pasar Anyar 	Salabenda – Air Mancur – Kebon Pedes – Jalan Baru – Kayu Manis – Jalan Baru – Kebon Pedes – A. Yani – Pasar Anyar 	Pasar Anyar - Salabenda',
  '5 	Angkot 	- 	15 	Bubulak - Pasar Anyar 	Bubulak - Pasar Anyar 	Pasar Anyar - Bubulak',
  '6 	Angkot 	- 	13 	Bantar Kemang - Ramayana 	Bantar Kemang – Pajajaran – Ir. H Juanda – Ramayana 	Ramayana - Ir. H. Juanda - Pajajaran - Bantar Kemang',
  '7 	Angkot 	- 	12 	Pasar Anyar - Cimanggu 	Pasar Anyar – Sudirman – RE. Martadinata -Tentara Pelajar – Cimanggu Taman/BTN 	Cimanggu Taman/BTN - Tentara Pelajar - RE. Martadinata - Sudirman - Pasar Anyar',
  '8 	Angkot 	- 	11 	Ramayana - Baranangsiang 	Ramayana - Baranangsiang 	Baranangsiang - Ramayana',
  '9 	Angkot 	- 	08 	Ciparigi (Jambu Dua) - Ramayana 	Ciparigi – Warung Jambu – Pajajaran – Ir. H Juanda – Suryakencana – Ramayana 	Ramayana - Suryakencana - Ir. H. Juanda - Pajajaran - Warung Jambu - Ciparigi'
];

const LINE_NO_COL = 3;
const NAME_COL = 4;
const STOPS_COL = 5;

var lat = {};
var lon = {};
var routes = {};
var indices = Object.keys(raw);
for (var i in indices) {
  var cells = raw[indices[i]].split('\t');
  var lineNo = cells[LINE_NO_COL].trim();
  routes[lineNo] = {
    name: cells[NAME_COL].trim(),
    stops: []
  };
  var stops = cells[STOPS_COL].split(/[–-]/);
  for (var j=0; j<stops.length; j++) {
    var place = stops[j].toLowerCase().trim();
    lat[place] = -6.6;
    lon[place] = 106.8;
    // console.log([lineNo, lat[place], lon[place], j, j*0.01, place].join(','));
    routes[lineNo].stops.push(place);
  }
}
console.log(JSON.stringify({
  places: Object.keys(lat).sort(),
  routes
}, null, 2));
