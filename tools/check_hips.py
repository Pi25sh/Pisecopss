import struct, json

with open('public/assets/characters/ch42_animated_protagonist.glb', 'rb') as f:
    f.seek(12)
    cl, ct = struct.unpack('<II', f.read(8))
    d = json.loads(f.read(cl))
    walk = d['animations'][0]
    for c in walk['channels']:
        sampler = walk['samplers'][c['sampler']]
        output_acc = d['accessors'][sampler['output']]
        buffer_view = d['bufferViews'][output_acc['bufferView']]
        byte_offset = buffer_view.get('byteOffset', 0) + output_acc.get('byteOffset', 0)
        count = output_acc['count']
        
        # Read the binary chunk
        f.seek(12 + 8 + cl) # start of binary chunk
        bin_len, bin_type = struct.unpack('<II', f.read(8))
        f.seek(12 + 8 + cl + 8 + byte_offset)
        raw = f.read(count * 12)
        floats = struct.unpack(f'<{count * 3}f', raw)
        target = c['target']
        node_name = d['nodes'][target['node']].get('name')
        path = target['path']
        if path == 'translation':
            print(f"Node {node_name} translation count={count}")
            print(f"  First 3 translations: {floats[0:3]}, {floats[3:6]}, {floats[6:9]}")
            print(f"  Last translation: {floats[-3:]}")
            break
