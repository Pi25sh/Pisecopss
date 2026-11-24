with open(r"d:\bombaii thefts\Ch42_nonPBR.fbx", "rb") as f:
    data = f.read(200000) # first 200KB

import re
print("Version:", data[:25])
videos = re.findall(rb"Video::[\w\.-]+", data)
print("Videos:", set(v.decode('latin1') for v in videos))
props = re.findall(rb"Property70:\s*\"([^\"]+)\"", data)
print("Sample props:", set(p.decode('latin1') for p in props[:20]))
