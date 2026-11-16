#!/bin/bash
# usage: gen_clips.sh W H outdir   (camera moves for every photo, lengths match brief.json)
W=$1; H=$2; O=$3; mkdir -p $O; P=scripts/photo2clip.py; M=media
export CLIP_W=$W CLIP_H=$H
python3 $P $M/view_marina.jpg $O/view_marina.mp4 3.5 0.45 0.80 1.0 1.08 0.5 &
python3 $P $M/view_marina.jpg $O/view_marina2.mp4 5.2 0.85 0.35 1.05 1.0 0.5 &
python3 $P $M/view_promenade.jpg $O/view_promenade.mp4 3.6 0.15 0.55 1.0 1.06 0.5 &
python3 $P $M/view_promenade.jpg $O/view_promenade_cta.mp4 8.1 0.6 0.2 1.0 1.06 0.5 &
wait
python3 $P $M/living.jpg $O/living.mp4 4.3 0.05 0.80 1.0 1.05 0.5 &
python3 $P $M/bed_master.jpg $O/bed_master.mp4 2.7 0.25 0.60 1.0 1.10 0.5 &
python3 $P $M/bed_green.jpg $O/bed_green.mp4 2.7 0.70 0.30 1.04 1.12 0.5 &
python3 $P $M/kitchen.jpg $O/kitchen.mp4 6.3 0.05 0.55 1.0 1.08 0.5 &
wait
python3 $P $M/balcony_sofa.jpg $O/balcony_sofa.mp4 5.6 0.05 0.90 1.0 1.06 0.5 &
python3 $P $M/hermon.jpg $O/hermon.mp4 8.3 0.30 0.55 1.0 1.15 0.4 &
wait
