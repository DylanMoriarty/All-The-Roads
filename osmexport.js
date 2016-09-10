var osmium = require('osmium');
var fs = require('fs');
var gjstream = require('geojson-stream');
var ProgressBar = require('progress');
var through = require('through');

var reader = new osmium.Reader('north-america-latest.osm.pbf');
var handler = new osmium.Handler();


// FIRST PASS - COUNT THE WAYS

var ways = 0;

handler.on('way', function (way) {
  if ( way.tags('highway') && way.tags().highway === 'primary') ways++;
});


osmium.apply(reader, handler);

// SECOND PASS - PROCESS WAYS

var fileout = fs.createWriteStream('us-roads.geojson');
var featureout = gjstream.stringify();

var bar = new ProgressBar(' processing [:bar] :percent :etas', {
  complete: '=',
  incomplete: ' ',
  total: ways
});

var file_bar = new ProgressBar(' writing [:bar] :percent :etas', {
  complete: '=',
  incomplete: ' ',
  total: ways
});

// Updates the writing to file bar
featureout.pipe(through(function (data) {
  file_bar.tick();
  this.queue(data);
})).pipe(fileout);


handler.on('way', function (way) {
  try {  
    if (way.tags('highway')) {
      var wayfeature = {
        type: 'Feature',
        geometry: way.geojson(),
        properties: { class: way.tags().highway }
      };
      featureout.write(wayfeature);
      bar.tick();
    }
  } catch(e) {
    console.log(way);
    console.log(e);
  }
});

var reader = new osmium.Reader('north-america-latest.osm.pbf');
var locationhandler = new osmium.LocationHandler();
osmium.apply(reader, locationhandler, handler);
featureout.end();
console.log('Done processing...writing to file.');