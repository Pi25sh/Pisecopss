import subprocess
import os
import shutil

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
out_dir = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public"
art_dir = r"C:\Users\piyus\.gemini\antigravity\brain\bb1999c5-b7db-4dc5-a742-9179d61d951e"

models = ["taxi", "chaatCart", "pisecops"]

for m in models:
    dest_path = os.path.join(out_dir, f"studio_{m}_live.png")
    cmd = [
        chrome,
        "--headless=new",
        f"--screenshot={dest_path}",
        "--window-size=1280,720",
        "--virtual-time-budget=6000",
        f"http://localhost:5173/?model={m}"
    ]
    subprocess.run(cmd, capture_output=True)
    if os.path.exists(dest_path):
        art_dest = os.path.join(art_dir, f"studio_{m}_live.png")
        shutil.copyfile(dest_path, art_dest)
        print(f"Captured and copied: {m} ({os.path.getsize(dest_path)} bytes)")
