# bogor-angkot-gtfs

A gtfs feed for public minibuses ("angkots") in Bogor, Indonesia.

This gtfs feed is available on transitland:

https://transit.land/feed-registry/operators/o-qqgfq-pemerintahkotabogorangkotankota

and on transitfeeds.com (includes per-route maps):

https://transitfeeds.com/p/bogor-angkots/725/latest/routes

This gtfs feed contains data from the following data sources:
  * http://enterbogor.blogspot.co.id/2016/03/inilah-rute-terbaru-angkot-bogor-mulai.html (updated in 2016 for the one-way central ring)
  * http://lovelybogor.com/rute-angkot-kota-bogor/ (very complete list, especially for inner city lines - Kota as opposed to Kabupaten)
  * http://www.majalahtransportasi.com/2015/04/rute-angkutan-umum-wilayah-bogor.html (also contains Kabupaten lines and some of the line colours)
  * http://kotabogor.go.id/index.php/rute (only official one from the city hall apparently, but only lists a few lines)
  * https://web.archive.org/web/20150707025713/http://bogor.2menit.com/Transportasi%20-%20Angkutan%20Umum%20(Angkot)%20Bogor.html (domain expired; it used to have the line colour codes in images but unfortunately neither the Internet Archive nor Google Cache seems to have a copy of it)
  * A printed list of provincial angkots, which I personally obtained from the DLLAJ office.
  * by hand from personal experience (riding angkots myself with a GPS tracker)
  * I also found http://angkotkotabogor.big.go.id/ but unfortunately its server seems to be broken (there are 501 responses to XHR requests when I tried to use it).


This repo also contains a gtfs shapes.txt viewer, copied from https://gist.github.com/kaezarrex/7a100491d541031b6c24

# To use:

* clone this repo
* Run `sh ./build.sh`
* It will generate a gtfs feed and a [map svg-file](https://github.com/michielbdejong/bogor-angkot-gtfs/blob/master/release/map.svg) in the release folder.
* I also have `sh ./publish.sh` to publish the svg file on http://michielbdejong.com/angkots.svg (a gh-pages site)

# License
<img src="http://i.creativecommons.org/p/zero/1.0/88x31.png">

This work is released to the public domain under [CC-0](https://creativecommons.org/share-your-work/public-domain/cc0/)
