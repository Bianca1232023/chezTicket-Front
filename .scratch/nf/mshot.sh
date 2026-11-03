#!/bin/bash
# usage: mshot.sh route height out
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$C" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PWD/.scratch/nf/profile" --virtual-time-budget=8000 --window-size=500,$2 --screenshot="$PWD/.scratch/nf/$3" "file://$PWD/.scratch/nf/frame.html#$1" >/dev/null 2>&1
/tmp/imgtool/imgtool crop "$PWD/.scratch/nf/$3" "$PWD/.scratch/nf/$3" 0 0 390 $2
