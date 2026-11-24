from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import time
import os

OUT_PATH = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public\assets\characters\ch42_animated_protagonist.glb"

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(length)
        with open(OUT_PATH, 'wb') as f:
            f.write(data)
        print(f"\n[SUCCESS] Received and saved GLB to {OUT_PATH} ({len(data)/(1024*1024):.2f} MB)")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b"OK")
        # Exit after saving
        os._exit(0)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

server = HTTPServer(('127.0.0.1', 8999), Handler)
print("GLB Receiver server listening on http://127.0.0.1:8999/...")

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
proc = subprocess.Popen([
    chrome,
    "--headless=new",
    "http://localhost:5173/convert_fbx_to_glb.html"
])

server.handle_request()
proc.terminate()
