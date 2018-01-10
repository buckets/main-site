#!/bin/sh

( sleep 1; python -c 'import webbrowser; webbrowser.open("http://127.0.0.1:1313")' ) &
hugo server --disableFastRender $@