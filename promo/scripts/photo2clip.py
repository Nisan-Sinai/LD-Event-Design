"""Turn a still photo into a 1080x1920 'camera move' clip (smooth pan + push-in).
usage: photo2clip.py in.jpg out.mp4 dur x0 x1 z0 z1 [y]
x0/x1 = horizontal position (0..1 of the free travel), z0/z1 = zoom, y = vertical focus."""
import sys, subprocess, numpy as np
from PIL import Image, ImageOps
src, out, dur, x0, x1, z0, z1 = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:8])
fy = float(sys.argv[8]) if len(sys.argv) > 8 else 0.5
W, H, FPS = 1080, 1920, 30
im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
s = max(W / im.width, H / im.height) * max(z0, z1) * 1.0
big = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
n = int(dur * FPS)
ease = lambda p: p * p * (3 - 2 * p)
enc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                        "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
zmax = max(z0, z1)
for k in range(n):
    p = ease(k / max(1, n - 1))
    z = z0 + (z1 - z0) * p
    cw, ch = W * zmax / z, H * zmax / z          # crop size in 'big' pixels
    cw, ch = min(cw, big.width), min(ch, big.height)
    fx = x0 + (x1 - x0) * p
    cx = cw / 2 + (big.width - cw) * fx
    cy = ch / 2 + (big.height - ch) * fy
    a = cw / W
    fr = big.transform((W, H), Image.AFFINE, (a, 0, cx - cw / 2, 0, a, cy - ch / 2), Image.BICUBIC)
    enc.stdin.write(np.asarray(fr).tobytes())
enc.stdin.close(); enc.wait()
print(out)
