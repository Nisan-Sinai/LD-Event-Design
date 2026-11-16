"""Place narration lines at scene starts. usage: build_vo.py brief.json out.wav line.wav:scene ..."""
import sys, json, subprocess, wave, numpy as np
b = json.load(open(sys.argv[1])); out = sys.argv[2]
durs = []
for x in b["scenes"]:
    durs += [i["dur"] for i in x["items"]] if x["type"] == "services" else [x["dur"]]
t0 = np.round(np.cumsum([0] + durs) * 30) / 30
SR = 48000; N = int((t0[-1] + .5) * SR); mix = np.zeros((N, 2), np.float32)
for spec in sys.argv[3:]:
    f, si = spec.rsplit(":", 1); si = int(si)
    a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                                     capture_output=True).stdout, np.float32).reshape(-1, 2)
    st = int((t0[si] + (0.1 if si == 0 else 0.15)) * SR); mix[st:st + len(a)] += a[:N - st]
    print(f"{f} @{t0[si]:.2f} ends {st/SR+len(a)/SR:.2f}")
print("total", t0[-1])
pcm = (np.clip(mix / np.abs(mix).max() * 0.95, -1, 1) * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
