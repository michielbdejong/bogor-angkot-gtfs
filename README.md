# bogor-angkot-gtfs
# A work in progress!

A gtfs feed for public minibuses ("angkots") in Bogor, Indonesia.
* Viewer copied from https://gist.github.com/kaezarrex/7a100491d541031b6c24
* gtfs feed created by hand from personal experience.
* So far, only line 01 (Barangsiang - Ciawi) and parts of lines 07 and 08 filled in, as a proof of concept.

# To use:

* clone this repo, and run a webserver in the `viewer` folder of the checked out repo, for instance with `cd viewer; python -m SimpleHTTPServer`.
* `cd bogor-gtfs/ ; zip -r ../bogor-gtfs.zip *`
* Open http://localhost:8000/ with your browser and select bogor-gtfs.zip as the gtfs feed to view.
* You'll see a map of angkot lines in Kota Bogor (Indonesia).
