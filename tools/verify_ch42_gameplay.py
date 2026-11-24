import subprocess
import os
import shutil

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
public_dir = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public"
art_dir = r"C:\Users\piyus\.gemini\antigravity\brain\bb1999c5-b7db-4dc5-a742-9179d61d951e"

# 1. Capture in-game open world with Ch42
game_screenshot = os.path.join(public_dir, "gameplay_ch42_live.png")
cmd1 = [
    chrome,
    "--headless=new",
    f"--screenshot={game_screenshot}",
    "--window-size=1280,720",
    "--virtual-time-budget=10000",
    "http://localhost:5173/?mode=game"
]
subprocess.run(cmd1, capture_output=True)
if os.path.exists(game_screenshot):
    shutil.copyfile(game_screenshot, os.path.join(art_dir, "gameplay_ch42_live.png"))
    print("Gameplay with Ch42 captured, size:", os.path.getsize(game_screenshot))
else:
    print("Failed to capture gameplay_ch42_live.png")

# 2. Capture studio inspector with Ch42
studio_screenshot = os.path.join(public_dir, "studio_ch42_live.png")
cmd2 = [
    chrome,
    "--headless=new",
    f"--screenshot={studio_screenshot}",
    "--window-size=1280,720",
    "--virtual-time-budget=10000",
    "http://localhost:5173/?model=ch42"
]
subprocess.run(cmd2, capture_output=True)
if os.path.exists(studio_screenshot):
    shutil.copyfile(studio_screenshot, os.path.join(art_dir, "studio_ch42_live.png"))
    print("Studio Ch42 captured, size:", os.path.getsize(studio_screenshot))
else:
    print("Failed to capture studio_ch42_live.png")
