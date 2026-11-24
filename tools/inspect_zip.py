import zipfile
import os

zpath = r"d:\bombaii thefts\PiSecOps_Mumbai_3D_Map_Prototype.zip"
print("Exists:", os.path.exists(zpath))
if os.path.exists(zpath):
    print("Size:", os.path.getsize(zpath), "bytes")
    with zipfile.ZipFile(zpath, 'r') as z:
        items = z.infolist()
        print(f"Total entries: {len(items)}")
        for info in items:
            print(f"{info.filename:65s} {info.file_size:10d} bytes")
