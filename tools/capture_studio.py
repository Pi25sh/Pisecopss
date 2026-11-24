import subprocess
import os

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
art_dir = r"C:\Users\piyus\.gemini\antigravity\brain\bb1999c5-b7db-4dc5-a742-9179d61d951e"
shot = os.path.join(art_dir, "studio_ch42_verified.png")

cmd = [
    chrome,
    "--headless=new",
    f"--screenshot={shot}",
    "--window-size=1280,720",
    "--virtual-time-budget=6000",
    "http://localhost:5173/?model=ch42"
]
subprocess.run(cmd)
if os.path.exists(shot):
    print("Studio screenshot captured, size:", os.path.getsize(shot))
