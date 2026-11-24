import os, struct, json

def inspect_glb(path):
    if not os.path.exists(path):
        return None
    with open(path, 'rb') as f:
        magic, ver, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        d = json.loads(f.read(chunk_len))
        nodes = [n.get('name') for n in d.get('nodes', [])]
        accs = d.get('accessors', [])
        bounds = [(a.get('min'), a.get('max')) for a in accs if a.get('type') == 'VEC3']
        return {
            'file': os.path.basename(path),
            'size_kb': round(os.path.getsize(path)/1024, 1),
            'nodes': nodes[:5],
            'bounds': bounds[0] if bounds else None
        }

assets = [
    'public/assets/vehicles/mumbai_santro_taxi.glb',
    'public/assets/vehicles/auto_rickshaw_realistic.glb',
    'public/assets/vehicles/mumbai_motorcycle_realistic.glb',
    'public/assets/vehicles/mumbai_police_suv.glb',
    'public/assets/vehicles/best_bus_realistic.glb',
    'public/assets/characters/civilian_npc_realistic.glb',
    'public/assets/characters/traffic_cop_realistic.glb',
    'public/assets/characters/street_vendor_realistic.glb',
    'public/assets/buildings/gateway_of_india.glb',
    'public/assets/buildings/mumbai_urban_building_aaa.glb',
    'public/assets/buildings/mumbai_glass_skyscraper.glb',
]

for a in assets:
    info = inspect_glb(a)
    print(info)
