import struct, json

with open('public/assets/buildings/gateway_of_india.glb', 'rb') as f:
    f.seek(12)
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    d = json.loads(f.read(chunk_len))
    for i, n in enumerate(d.get('nodes', [])):
        print(f"Node {i}:", n)
