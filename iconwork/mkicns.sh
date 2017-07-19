#!/bin/bash

PNGFILE=$1
DST=$2

if [ -z "$PNGFILE" ] || [ -z "$DST" ]; then
    echo "Usage: PNGFILE.png OUTPUT.icns"
    exit 1
fi

DIRNAME="${DST}.iconset"

mkdir -p "$DIRNAME"

convert -resize 16 "${PNGFILE}" "${DIRNAME}/icon_16x16.png"
convert -resize 32 "${PNGFILE}" "${DIRNAME}/icon_32x32.png"
convert -resize 128 "${PNGFILE}" "${DIRNAME}/icon_128x128.png"
convert -resize 256 "${PNGFILE}" "${DIRNAME}/icon_256x256.png"
convert -resize 512 "${PNGFILE}" "${DIRNAME}/icon_512x512.png"

iconutil -c icns -o "$DST" "$DIRNAME"

rm -r "$DIRNAME"