"""Retime all reel versions to the narration in tts/v3, regenerate camera-move clips, briefs and voiceovers."""
import json, copy, subprocess, os
V = "tts/v3"
L = {i: float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{V}/l{i}.wav"],
                              capture_output=True, text=True).stdout) for i in range(15)}
r = lambda x: round(x + 0.049, 1)
b = json.load(open("brief.json")); s = b["scenes"]
b["brand"]["tagline"] = "דירת נופש על קו המים • טבריה"
D = dict(hook=r(max(2.2, L[0] + .55)), logo=r(L[1] + .6), t2=r(max(2.6, L[2] + .55)), t3=r(max(3.0, L[3] + .55)),
         bed=r(max(1.9, (L[4] + .55) / 2)), check=r(max(4.0, L[5] + .55)), balc=r(L[6] + .55), coll=r(L[7] + .55),
         cnt=2.6, txt=r(max(3.5, L[8] + .55 - 2.6)), cta=r(L[9] + 1.3))
s[0]["dur"] = D["hook"]; s[1]["dur"] = D["logo"]; s[2]["dur"] = D["t2"]; s[3]["dur"] = D["t3"]
for it in s[4]["items"]: it["dur"] = D["bed"]
s[5]["dur"] = D["check"]; s[6]["dur"] = D["balc"]; s[7]["dur"] = D["coll"]; s[8]["dur"] = D["cnt"]
s[9]["dur"] = D["txt"]; s[9]["clip"]["start"] = D["cnt"]; s[10]["dur"] = D["cta"]
json.dump(b, open("brief.json", "w"), ensure_ascii=False, indent=1)
save = lambda n, x: json.dump(x, open(n, "w"), ensure_ascii=False, indent=1)
hB, hC = r(max(2.4, L[10] + .55)), r(max(2.2, L[11] + .55))
B = copy.deepcopy(b); B["out"] = "resort_kinneret_reel_hookB.mp4"; B["voiceover"]["file"] = "assets/vo_hookB.wav"
B["scenes"][0].update(small="נוף כזה", big="מהמרפסת שלכם", dur=hB, clip={"src": "media/balcony_sofa.mp4", "start": 0}); save("brief_hookB.json", B)
C = copy.deepcopy(b); C["out"] = "resort_kinneret_reel_hookC.mp4"; C["voiceover"]["file"] = "assets/vo_hookC.wav"
C["scenes"][0].update(small="מחפשים חופשה", big="בטבריה?", dur=hC); save("brief_hookC.json", C)
mid = L[13] + .6; a1, a2 = r(max(2.0, mid * .34)), r(max(1.8, mid * .3)); a3 = r(max(2.2, mid - a1 - a2))
S = copy.deepcopy(b); S["out"] = "resort_kinneret_reel_short.mp4"; S["voiceover"]["file"] = "assets/vo_short.wav"
S["scenes"] = [dict(s[0]), dict(s[1], dur=r(L[12] + .6)),
  {"type": "title", "small": "סלון מפואר", "big": "נוף לכנרת", "dur": a1, "transition": "whip", "look": {"dim": 0.7}, "clip": {"src": "media/living.mp4", "start": 0.6}},
  {"type": "title", "small": "2 חדרי שינה", "big": "מפוארים", "dur": a2, "transition": "fade", "clip": {"src": "media/bed_master.mp4", "start": 0, "look": {"dim": 0.62}}},
  {"type": "title", "small": "מרפסת ענקית", "big": "קו ראשון", "big2": "למים", "dur": a3, "transition": "zoom", "clip": {"src": "media/balcony_sofa.mp4", "start": 0.5}},
  dict(s[10], dur=r(L[14] + 1.6), eyebrow="עד 10 נפשות • צמוד לרב קוק")]
save("brief_short.json", S)
for fmt, d in (("1x1", "media/1x1"), ("4x5", "media/4x5")):
    F = copy.deepcopy(b); F["format"] = fmt; F["out"] = f"resort_kinneret_reel_{fmt}.mp4"
    for x in F["scenes"]:
        for c in [x.get("clip")] + [i.get("clip") for i in x.get("items", []) if isinstance(i, dict)]:
            if isinstance(c, dict) and c["src"].endswith(".mp4"): c["src"] = c["src"].replace("media/", d + "/")
    if fmt == "1x1":
        ck = F["scenes"][5]
        F["scenes"][5] = {"type": "text", "dur": ck["dur"], "transition": "zoom", "clip": ck["clip"], "look": {"dim": 0.6}, "lines": [
            {"text": "2 חדרי רחצה", "style": "small"}, {"text": "מטבח מאובזר", "style": "big", "size": 150}, {"text": "+ מיחם לשבת", "style": "small"}]}
    save(f"brief_{fmt}.json", F)
# camera-move clips (lengths cover the longest use)
J = [("view_marina", "view_marina", max(D["hook"], hC), 0.45, 0.80, 1.0, 1.08, 0.5),
     ("view_marina", "view_marina2", D["logo"], 0.85, 0.35, 1.05, 1.0, 0.5),
     ("view_promenade", "view_promenade", D["t2"], 0.15, 0.55, 1.0, 1.06, 0.5),
     ("view_promenade", "view_promenade_cta", D["cta"], 0.6, 0.2, 1.0, 1.06, 0.5),
     ("living", "living", D["t3"], 0.05, 0.80, 1.0, 1.05, 0.5),
     ("bed_master", "bed_master", D["bed"], 0.25, 0.60, 1.0, 1.10, 0.5),
     ("bed_green", "bed_green", D["bed"], 0.70, 0.30, 1.04, 1.12, 0.5),
     ("kitchen", "kitchen", D["check"], 0.05, 0.55, 1.0, 1.08, 0.5),
     ("balcony_sofa", "balcony_sofa", D["balc"], 0.05, 0.90, 1.0, 1.06, 0.5),
     ("hermon", "hermon", D["cnt"] + D["txt"], 0.30, 0.55, 1.0, 1.15, 0.4)]
procs = []
for W, H, od in ((1080, 1920, "media"), (1080, 1080, "media/1x1"), (1080, 1350, "media/4x5")):
    os.makedirs(od, exist_ok=True)
    env = dict(os.environ, CLIP_W=str(W), CLIP_H=str(H))
    for src, out, dur, *mv in J:
        procs.append(subprocess.Popen(["python3", "scripts/photo2clip.py", f"media/{src}.jpg", f"{od}/{out}.mp4", str(dur + .4)] + [str(m) for m in mv],
                                      env=env, stdout=subprocess.DEVNULL))
        if len(procs) % 4 == 0: [p.wait() for p in procs]
[p.wait() for p in procs]
full = lambda h: [f"{V}/l{h}.wav:0"] + [f"{V}/l{i}.wav:{sc}" for i, sc in ((1, 1), (2, 2), (3, 3), (4, 4), (5, 6), (6, 7), (7, 8), (8, 9), (9, 11))]
run = lambda br, out, m: print(subprocess.run(["python3", "scripts/build_vo.py", br, out] + m, capture_output=True, text=True).stdout)
run("brief.json", "assets/voiceover.wav", full(0)); run("brief_hookB.json", "assets/vo_hookB.wav", full(10))
run("brief_hookC.json", "assets/vo_hookC.wav", full(11))
run("brief_short.json", "assets/vo_short.wav", [f"{V}/l0.wav:0", f"{V}/l12.wav:1", f"{V}/l13.wav:2", f"{V}/l14.wav:5"])
print(D)
