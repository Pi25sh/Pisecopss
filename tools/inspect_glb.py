import struct, json

with open('public/assets/characters/ch42_animated_protagonist.glb', 'rb') as f:
    f.seek(12)
    cl, ct = struct.unpack('<II', f.read(8))
    d = json.loads(f.read(cl))
    print('Nodes:', len(d.get('nodes', [])))
    print('Meshes:', len(d.get('meshes', [])))
    for i, m in enumerate(d.get('meshes', [])):
        print(f"Mesh {i} name: {m.get('name')}")
        for p in m.get('primitives', []):
            pos_idx = p['attributes'].get('POSITION')
            if pos_idx is not None:
                acc = d['accessors'][pos_idx]
                print('  Pos min:', acc.get('min'), 'max:', acc.get('max'))
    print('Animations:', [a.get('name') for a in d.get('animations', [])])
    for a in d.get('animations', []):
        print(f"Anim {a.get('name')}: {len(a.get('channels', []))} channels, {len(a.get('samplers', []))} samplers")
