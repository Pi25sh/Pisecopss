import struct, json

with open('public/assets/buildings/gateway_of_india.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    d = json.loads(f.read(chunk_len))
    print('Extensions used:', d.get('extensionsUsed', []))
    print('Extensions required:', d.get('extensionsRequired', []))
    print('Nodes count:', len(d.get('nodes', [])))
    print('Meshes count:', len(d.get('meshes', [])))
    for i, m in enumerate(d.get('meshes', [])):
        print(f"Mesh {i} primitives: {len(m.get('primitives', []))}")
        for p in m.get('primitives', []):
            pos_acc = d['accessors'][p['attributes']['POSITION']]
            print('  Pos min:', pos_acc.get('min'), 'max:', pos_acc.get('max'))
