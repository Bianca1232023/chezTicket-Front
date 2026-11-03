#!/bin/bash
# usage: ce-shot.sh step width height out
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=$2,$3 --virtual-time-budget=4000 --screenshot=/Users/bianca.santana/Desktop/chezTicket-Front/scratch/$4 "http://127.0.0.1:4182/?step=$1#/criar-evento" 2>&1 | tail -1
