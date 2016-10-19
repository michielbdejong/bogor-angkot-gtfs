var fs = require('fs');

const HEAD_MINUTES = 10; // minutes between one angkot and the next one of the same route, at any given stop

var headers = {
  agency: 'agency_id,agency_name,agency_url,agency_timezone,agency_lang,agency_phone,agency_fare_url',
  calendar: 'service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date',
  fare_attributes: 'fare_id,price,currency_type,payment_method,transfers,transfer_duration',
  routes: 'route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color',
  stops: 'stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url,location_type,parent_station,stop_timezone,wheelchair_boarding',
  trips: 'route_id,service_id,trip_id,trip_headsign,trip_short_name,direction_id,block_id,shape_id,wheelchair_accessible,bikes_allowed',
  calendar_dates: 'service_id,date,exception_type',
  frequencies: 'trip_id,start_time,end_time,headway_secs,exact_times',
  shapes: 'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled',
  stop_times: 'trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled,timepoint',
};

var fixed = {
  agency: 'DLLAJ,Pemerintah Kota Bogor angkotan kota,http://kotabogor.go.id/index.php/rute,Asia/Jakarta',
  calendar: 'FULL,1,1,1,1,1,1,1,20160101,20251231',
  fare_attributes: 'biasa,3500,IDR,0,0,\nsiswa,2500.25,IDR,0,0,\nkabupaten,6000,IDR,0,0,',
};

var data = fs.readFileSync('manual-from-transitwand/kota/shapes.txt').toString().split('\n').map(line => line.split(','));
console.log('Processing...');

var stopTimes = [];
var shapes = [];
var seq = [];
var stops = {};
var stopsArr = [];
var trips = [];

function getStop(lat, lon, name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    name = `ll_${lat}_${lon}`;
  } else {
    name = name.trim();
    if (name[0] === '#' || name[0] === '*') {
      name = name.substr(1);
    }
  }
  if (!stops[name]) {
    stops[name] = [lat, lon];
//  stops: 'stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url,location_type,parent_station,stop_timezone,wheelchair_boarding',
    stopsArr.push(`${name},,${name},,${lat},${lon},,,,,,2`);
  }
  return name;
}

function toTime(seqNo, hour, minute) {
  var seqMinute = minute + seqNo;
  var seqHour = hour;
  var minuteStr;
  var hourStr;
  if (seqMinute >= 60) {
    seqHour++;
    seqMinute -= 60;
  }
  if (seqHour >= 24) {
    seqHour -= 24;
  }
  if (seqMinute < 10) {
    minuteStr = `0${seqMinute}`;
  } else {
    minuteStr = `${seqMinute}`;
  }
  if (seqHour < 10) {
    hourStr = `0${seqHour}`;
  } else {
    hourStr = `${seqHour}`;
  }
  return `${hourStr}:${minuteStr}:00`;
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
//  stop_times: 'trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled,timepoint',
  for (var hour = 0; hour<24; hour++) {
    for (var minute = 0; minute<60; minute += HEAD_MINUTES) {
      var time = toTime(seq[line[0]], hour, minute);
      stopTimes.push(`${line[0]},${time},${time},${getStop(line[1], line[2], line[5])},${seq[line[0]]},,,,,0`);
    }
  }
//  shapes: 'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence',
  shapes.push(`${line[0]},${line[1]},${line[2]},${seq[line[0]]}`);
}

for (var fileName in fixed) {
  fs.writeFileSync(`gtfs/${fileName}.txt`, headers[fileName] + '\n' + fixed[fileName] + '\n');
}

//  routes: 'route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color',
fs.writeFileSync('gtfs/routes.txt', headers.routes + '\n' +
  trips.map(name => `${name},DLLAJ,${name},${name},,3,,00FF00,000000`).join('\n') + '\n');
//  stops: 'stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url,location_type,parent_station,stop_timezone,wheelchair_boarding',
fs.writeFileSync('gtfs/stops.txt', headers.stops+'\n'+stopsArr.join('\n'));
//  trips: 'route_id,service_id,trip_id,trip_headsign,trip_short_name,direction_id,block_id,shape_id,wheelchair_accessible,bikes_allowed',
fs.writeFileSync('gtfs/trips.txt', headers.trips + '\n' + trips.map(name => `${name},FULL,${name},${name},,,,${name},2,2`).join('\n') + '\n');
//  frequencies: 'trip_id,start_time,end_time,headway_secs',
fs.writeFileSync('gtfs/frequencies.txt', headers.frequencies + '\n' +
  trips.map(name => `${name},06:00:00,24:00:00,60,0`).join('\n') + '\n');
//  shapes: 'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence',
fs.writeFileSync('gtfs/shapes.txt', headers.shapes + '\n' + shapes.join('\n') + '\n');
//  stop_times: 'trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,dropoff_type,shape_dist_traveled,timepoint',
fs.writeFileSync('gtfs/stop_times.txt', headers.stop_times + '\n' + stopTimes.join('\n') + '\n');
