#!/bin/sh

( sleep 1; python -c 'import webbrowser; webbrowser.open("http://127.0.0.1:1314")' ) &
hugo server --disableFastRender --port 1314 --theme buckets-trimmed $@


