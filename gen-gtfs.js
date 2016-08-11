var fs = require('fs');

var headers = {
  agency: 'agency_id,agency_name,agency_url,agency_timezone',
  calendar: 'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date',
  fare_rules: 'fare_id,route_id,origin_id,destination_id,contains_id',
  routes: 'route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color',
  stops: 'stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding',
  trips: 'route_id,service_id,trip_id,trip_headsign,direction_id,block_id,shape_id',
  calendar_dates: 'service_id,date,exception_type',
  fare_attributes: 'fare_id,price,currency_type,payment_method,transfers,transfer_duration',
  frequencies: 'trip_id,start_time,end_time,headway_secs',
  shapes: 'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled',
  stop_times: 'trip_id,arrival_time,departure_time,stop_id,stop_sequence,timepoint',
};

var fixed = {
  agency: 'DLLAJ,Pemerintah Kota Bogor angkotan kota,http://kotabogor.go.id/index.php/rute,Asia/Jakarta',
  calendar: 'FULL,1,1,1,1,1,1,1,20160101,20251231',
  fare_attributes: 'biasa,3500,IDR,0,0,\nsiswa,2500.25,IDR,0,0,\nkabupaten,6000,IDR,0,0,',
};

var data = fs.readFileSync('manual-from-transitwand/kota/shapes.txt').toString().split('\n').map(line => line.split(','));
console.log('Processing...');

var stopTimes = [];
var seq = [];
var stops = {};
var stopsArr = [];
var trips = [];

function getStop(lat, lon, name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    name = `ll_${lat}_${lon}`;
  } else {
    name = name.trim();
  }
  if (!stops[name]) {
    stops[name] = [lat, lon];
    // stops: 'stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding',
    stopsArr.push(`${name},${name},${lat},${lon},2`);
  }
  return name;
}

function toTime(seqNo) {
  if (seqNo < 10) {
    seqNo = `0${seqNo}`;
  }
  return `12:${seqNo}:00`;
}

for (var i=1; i<data.length; i++) {
  line = data[i];
  if (line.length < 3) {
    continue;
  }
  if (typeof seq[line[0]] === 'undefined') {
    trips.push(line[0]);
    seq[line[0]] = 0;
  } else {
    seq[line[0]]++;
  }
  stopTimes.push([
    line[0],
    toTime(seq[line[0]]),
    toTime(seq[line[0]]),
    getStop(line[1], line[2], line[5]),
    seq[line[0]],
    0
  ]);
}

for (var fileName in fixed) {
  fs.writeFileSync(`release/${fileName}.txt`, headers[fileName]+'\n'+fixed[fileName]+'\n');
}
fs.writeFileSync('release/stops.txt', headers.stops+'\n'+stopsArr.join('\n'));
fs.writeFileSync('release/trips.txt', headers.trips+'\n'+trips.map(name => `${name},0,${name}`).join('\n')+'\n');
fs.writeFileSync('release/routes.txt', headers.routes+'\n'+trips.map(name => `${name},0,${name}`).join('\n')+'\n');
fs.writeFileSync('release/stop_times.txt', headers.stop_time+'\n'+stopTimes.map(line => line.join(',')).join('\n')+'\n');
