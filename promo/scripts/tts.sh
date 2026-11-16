#!/bin/bash
# usage: tts.sh "text" out.wav   -> warm processed Hebrew female narration (edge-tts Hila)
set -e
tmp=$(mktemp --suffix=.mp3)
timeout 60 edge-tts --proxy "$HTTPS_PROXY" --voice he-IL-HilaNeural --rate=-4% --pitch=-4Hz --text "$1" --write-media "$tmp" >/dev/null 2>&1 </dev/null
ffmpeg -nostdin -y -v error -i "$tmp" -af "aresample=48000:resampler=soxr,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=75,equalizer=f=180:t=q:w=0.9:g=3,equalizer=f=320:t=q:w=1:g=1.5,equalizer=f=2800:t=q:w=1.2:g=-2.5,equalizer=f=5500:t=q:w=1.5:g=-3.5,lowpass=f=9500,deesser=i=0.5,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,aecho=0.85:0.5:28|47:0.10|0.06,apad=pad_dur=0.25" -ac 2 "$2"
rm -f "$tmp"
echo "$2 $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$2")"
