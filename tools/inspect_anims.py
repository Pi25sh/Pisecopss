import struct, json

with open('public/assets/characters/ch42_animated_protagonist.glb', 'rb') as f:
    f.seek(12)
    cl, ct = struct.unpack('<II', f.read(8))
    d = json.loads(f.read(cl))
    for a in d.get('animations', []):
        print('Animation:', a.get('name'))
        for c in a.get('channels', []):
            target = c['target']
            node_id = target.get('node')
            node_name = d['nodes'][node_id].get('name') if node_id is not None else '?'
            path = target.get('path')
            sampler = a['samplers'][c['sampler']]
            input_acc = d['accessors'][sampler['input']]
            print(f"  Channel target: {node_name}.{path}, time min: {input_acc.get('min')}, max: {input_acc.get('max')}")
            break
