#!/bin/bash
# usage: shot.sh route w h out
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$C" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PWD/.scratch/nf/profile" --virtual-time-budget=8000 --window-size=$2,$3 --screenshot="$PWD/.scratch/nf/$4" "http://127.0.0.1:4184/#/$1" >/dev/null 2>&1
