import struct, json

with open('public/assets/characters/ch42_animated_protagonist.glb', 'rb') as f:
    f.seek(12)
    cl, ct = struct.unpack('<II', f.read(8))
    d = json.loads(f.read(cl))
    for i, node in enumerate(d.get('nodes', [])):
        if 'scale' in node:
            print(f"Node {i} scale: {node['scale']}")
        if 'name' in node and ('root' in node['name'].lower() or 'armature' in node['name'].lower() or 'mixamorig' in node['name'].lower()):
            print(f"Node {i} name: {node['name']} scale: {node.get('scale')}")
