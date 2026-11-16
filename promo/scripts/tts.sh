#!/bin/bash
# usage: tts.sh "text" out.wav   -> warm processed Hebrew female narration (edge-tts, default voice Emma multilingual)
set -e
tmp=$(mktemp --suffix=.mp3)
timeout 60 edge-tts --proxy "$HTTPS_PROXY" --voice ${VOICE:-en-US-EmmaMultilingualNeural} --rate=${RATE:--3%} --text "$1" --write-media "$tmp" >/dev/null 2>&1 </dev/null
ffmpeg -nostdin -y -v error -i "$tmp" -af "aresample=48000:resampler=soxr,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=75,equalizer=f=200:t=q:w=1:g=1.5,equalizer=f=6000:t=q:w=1.5:g=-1.5,acompressor=threshold=-20dB:ratio=2:attack=10:release=150:makeup=1.5,apad=pad_dur=0.25" -ac 2 "$2"
rm -f "$tmp"
echo "$2 $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$2")"
