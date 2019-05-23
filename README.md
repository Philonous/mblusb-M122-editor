# Blusb Model M Controller Keyboard Matrix Editor

This is a small static webap for creating layout matrices for the BlUSB Model M keyboard controller

**License: MIT** (See LICENSE file)

See <https://deskthority.net/viewtopic.php?t=21469> and <https://github.com/quintusl/mblusb>

## Try it
[Live version](https://philonous.github.io/mblusb-M122-editor/)

## Running locally
Unfortunately Firefox doesn't allow JavaScript to load external resourced from
local ("file://") URLs, so you have to serve the app from a web server, but any
old web server should do. A minimal docker-compose.yaml with an nginx-container
is included, so you can serve the project locally by just running
`docker-compose up` and pointing your browser at <http://localhost:8080>

## Comments
I have extracted the matrix positions of each individual key of the PC122 using
the USB tool and hard-coded them into the SVG as `data-matrix-col` and
`data-matrix-row` attributes on the `<g>` elements. You can see them by choosing
the "matrix" display option (shown in row/column format)
