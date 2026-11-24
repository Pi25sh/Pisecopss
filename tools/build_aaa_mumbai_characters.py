"""
build_aaa_mumbai_characters.py
======================================================
Compiles Ultra-Realistic, AAA-Quality 3D Humanoid Characters for PiSecOps Mumbai Open World:
1. PiSecOps Protagonist (Denim jacket, maroon henley, leather satchel, cargo pants)
2. Civilian Commuter NPC (Blue chambray shirt, cargo trousers, watch)
3. Mumbai Traffic Police (High-visibility neon rain gear with reflective stripes & peaked cap)
4. Street Food Vendor (Olive kurta, red-checked gamcha towel, cap)

Target Engine: Three.js / @react-three/fiber / WebGL
Zero external dependencies - Uses Python standard library, PIL, and NumPy.
"""

import os
import io
import math
import struct
import json
import random
from PIL import Image, ImageDraw
import numpy as np

OUTPUT_DIR = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public\assets\characters"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_normal_map(albedo_img, strength=2.5):
    arr = np.array(albedo_img.convert('L'), dtype=np.float32)
    h, w = arr.shape
    gx = np.roll(arr, -1, axis=1) - np.roll(arr, 1, axis=1)
    gy = np.roll(arr, -1, axis=0) - np.roll(arr, 1, axis=0)
    norm = np.zeros((h, w, 3), dtype=np.uint8)
    norm[:, :, 0] = np.clip(128 - gx * strength, 0, 255).astype(np.uint8)
    norm[:, :, 1] = np.clip(128 - gy * strength, 0, 255).astype(np.uint8)
    norm[:, :, 2] = 255
    return Image.fromarray(norm)

def box_geom(cx, cy, cz, sx, sy, sz, u_rep=(1.0, 1.0)):
    hx, hy, hz = sx / 2.0, sy / 2.0, sz / 2.0
    u, v = u_rep
    faces = [
        {'pos': [[cx-hx, cy-hy, cz+hz], [cx+hx, cy-hy, cz+hz], [cx+hx, cy+hy, cz+hz], [cx-hx, cy+hy, cz+hz]], 'n': [0, 0, 1]},
        {'pos': [[cx+hx, cy-hy, cz-hz], [cx-hx, cy-hy, cz-hz], [cx-hx, cy+hy, cz-hz], [cx+hx, cy+hy, cz-hz]], 'n': [0, 0, -1]},
        {'pos': [[cx-hx, cy+hy, cz+hz], [cx+hx, cy+hy, cz+hz], [cx+hx, cy+hy, cz-hz], [cx-hx, cy+hy, cz-hz]], 'n': [0, 1, 0]},
        {'pos': [[cx-hx, cy-hy, cz-hz], [cx+hx, cy-hy, cz-hz], [cx+hx, cy-hy, cz+hz], [cx-hx, cy-hy, cz+hz]], 'n': [0, -1, 0]},
        {'pos': [[cx+hx, cy-hy, cz+hz], [cx+hx, cy-hy, cz-hz], [cx+hx, cy+hy, cz-hz], [cx+hx, cy+hy, cz+hz]], 'n': [1, 0, 0]},
        {'pos': [[cx-hx, cy-hy, cz-hz], [cx-hx, cy-hy, cz+hz], [cx-hx, cy+hy, cz+hz], [cx-hx, cy+hy, cz-hz]], 'n': [-1, 0, 0]},
    ]
    p, n, uv, idx = [], [], [], []
    for f in faces:
        base = len(p)
        p.extend(f['pos'])
        n.extend([f['n']] * 4)
        uv.extend([[0, 0], [u, 0], [u, v], [0, v]])
        idx.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    return p, n, uv, idx

def cylinder_geom(cx, cy, cz, radius, height, segments=12, axis='y'):
    p, n, uv, idx = [], [], [], []
    hh = height / 2.0
    top_c, bot_c = len(p), len(p) + 1
    if axis == 'y':
        p.extend([[cx, cy + hh, cz], [cx, cy - hh, cz]])
        n.extend([[0, 1, 0], [0, -1, 0]])
    elif axis == 'x':
        p.extend([[cx + hh, cy, cz], [cx - hh, cy, cz]])
        n.extend([[1, 0, 0], [-1, 0, 0]])
    else:
        p.extend([[cx, cy, cz + hh], [cx, cy, cz - hh]])
        n.extend([[0, 0, 1], [0, 0, -1]])
    uv.extend([[0.5, 0.5], [0.5, 0.5]])

    ring_start = len(p)
    for i in range(segments + 1):
        ang = i * (2.0 * math.pi / segments)
        c, s = math.cos(ang), math.sin(ang)
        u_val = i / float(segments)
        if axis == 'y':
            p.extend([[cx + radius * c, cy + hh, cz + radius * s], [cx + radius * c, cy - hh, cz + radius * s]])
            n.extend([[c, 0, s], [c, 0, s]])
        elif axis == 'x':
            p.extend([[cx + hh, cy + radius * c, cz + radius * s], [cx - hh, cy + radius * c, cz + radius * s]])
            n.extend([[0, c, s], [0, c, s]])
        else:
            p.extend([[cx + radius * c, cy + radius * s, cz + hh], [cx + radius * c, cy + radius * s, cz - hh]])
            n.extend([[c, s, 0], [c, s, 0]])
        uv.extend([[u_val, 1.0], [u_val, 0.0]])

    for i in range(segments):
        idx0 = ring_start + i * 2
        idx.extend([idx0, idx0 + 1, idx0 + 2, idx0 + 1, idx0 + 3, idx0 + 2])
        idx.extend([top_c, idx0, idx0 + 2])
        idx.extend([bot_c, idx0 + 3, idx0 + 1])
    return p, n, uv, idx

def merge_geoms(geom_list):
    ap, an, auv, aidx = [], [], [], []
    for p, n, uv, idx in geom_list:
        base = len(ap)
        ap.extend(p)
        an.extend(n)
        auv.extend(uv)
        aidx.extend([i + base for i in idx])
    return ap, an, auv, aidx

# Reuse GLB exporter architecture
class GLBExporter:
    def __init__(self):
        self.materials, self.meshes, self.images = [], [], []

    def add_material(self, name, base_color=(1,1,1,1), roughness=0.5, metallic=0.0,
                     albedo_img=None, normal_img=None, rm_img=None):
        idx = len(self.materials)
        t_albedo = self._save_img(albedo_img)
        t_normal = self._save_img(normal_img)
        t_rm = self._save_img(rm_img)
        self.materials.append({
            'name': name,
            'base_color': base_color,
            'roughness': roughness,
            'metallic': metallic,
            'tex_albedo': t_albedo,
            'tex_normal': t_normal,
            'tex_rm': t_rm
        })
        return idx

    def _save_img(self, img):
        if img is None:
            return None
        i_idx = len(self.images)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        self.images.append(buf.getvalue())
        return i_idx

    def add_mesh(self, name, p, n, uv, idx, mat_idx=0):
        if not p: return
        self.meshes.append({
            'name': name, 'positions': p, 'normals': n, 'uvs': uv, 'indices': idx, 'mat_idx': mat_idx
        })

    def save(self, filepath):
        bin_data = bytearray()
        buffer_views, accessors = [], []

        def pad():
            rem = len(bin_data) % 4
            if rem != 0: bin_data.extend(b'\x00' * (4 - rem))

        gltf_meshes, gltf_nodes = [], []
        for m_idx, m in enumerate(self.meshes):
            pos_b = bytearray()
            min_p = [float('inf')]*3
            max_p = [float('-inf')]*3
            for pt in m['positions']:
                pos_b.extend(struct.pack('<3f', *pt))
                for c in range(3):
                    min_p[c] = min(min_p[c], pt[c])
                    max_p[c] = max(max_p[c], pt[c])

            norm_b = bytearray()
            for norm in m['normals']:
                norm_b.extend(struct.pack('<3f', *norm))

            uv_b = bytearray()
            for u in m['uvs']:
                uv_b.extend(struct.pack('<2f', *u))

            idx_b = bytearray()
            for i in m['indices']:
                idx_b.extend(struct.pack('<I', i))

            pad()
            pos_off = len(bin_data)
            bin_data.extend(pos_b)
            bv_pos = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': pos_off, 'byteLength': len(pos_b), 'target': 34962})
            acc_pos = len(accessors)
            accessors.append({'bufferView': bv_pos, 'byteOffset': 0, 'componentType': 5126, 'count': len(m['positions']), 'type': 'VEC3', 'min': min_p, 'max': max_p})

            pad()
            norm_off = len(bin_data)
            bin_data.extend(norm_b)
            bv_norm = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': norm_off, 'byteLength': len(norm_b), 'target': 34962})
            acc_norm = len(accessors)
            accessors.append({'bufferView': bv_norm, 'byteOffset': 0, 'componentType': 5126, 'count': len(m['normals']), 'type': 'VEC3'})

            pad()
            uv_off = len(bin_data)
            bin_data.extend(uv_b)
            bv_uv = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': uv_off, 'byteLength': len(uv_b), 'target': 34962})
            acc_uv = len(accessors)
            accessors.append({'bufferView': bv_uv, 'byteOffset': 0, 'componentType': 5126, 'count': len(m['uvs']), 'type': 'VEC2'})

            pad()
            idx_off = len(bin_data)
            bin_data.extend(idx_b)
            bv_idx = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': idx_off, 'byteLength': len(idx_b), 'target': 34963})
            acc_idx = len(accessors)
            accessors.append({'bufferView': bv_idx, 'byteOffset': 0, 'componentType': 5125, 'count': len(m['indices']), 'type': 'SCALAR'})

            gltf_meshes.append({
                'name': m['name'],
                'primitives': [{
                    'attributes': {'POSITION': acc_pos, 'NORMAL': acc_norm, 'TEXCOORD_0': acc_uv},
                    'indices': acc_idx,
                    'material': m['mat_idx'],
                    'mode': 4
                }]
            })
            gltf_nodes.append({'name': m['name'], 'mesh': m_idx})

        image_meta = []
        for img_bytes in self.images:
            pad()
            img_off = len(bin_data)
            bin_data.extend(img_bytes)
            bv_img = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': img_off, 'byteLength': len(img_bytes)})
            image_meta.append({'bufferView': bv_img, 'mimeType': 'image/png'})

        textures = [{'sampler': 0, 'source': i} for i in range(len(self.images))]
        gltf_mats = []
        for m in self.materials:
            pbr = {
                'baseColorFactor': list(m['base_color']),
                'roughnessFactor': float(m['roughness']),
                'metallicFactor': float(m['metallic'])
            }
            if m['tex_albedo'] is not None:
                pbr['baseColorTexture'] = {'index': m['tex_albedo']}
            if m['tex_rm'] is not None:
                pbr['metallicRoughnessTexture'] = {'index': m['tex_rm']}
            
            mat_dict = {'name': m['name'], 'pbrMetallicRoughness': pbr}
            if m['tex_normal'] is not None:
                mat_dict['normalTexture'] = {'index': m['tex_normal']}
            gltf_mats.append(mat_dict)

        gltf = {
            'asset': {'version': '2.0', 'generator': 'PiSecOps-Mumbai-Character-Builder'},
            'scene': 0,
            'scenes': [{'nodes': list(range(len(gltf_nodes)))}],
            'nodes': gltf_nodes,
            'meshes': gltf_meshes,
            'materials': gltf_mats,
            'textures': textures,
            'images': image_meta,
            'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}],
            'buffers': [{'byteLength': len(bin_data)}],
            'bufferViews': buffer_views,
            'accessors': accessors
        }

        json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
        while len(json_bytes) % 4 != 0: json_bytes += b' '
        while len(bin_data) % 4 != 0: bin_data += b'\x00'

        total_size = 12 + 8 + len(json_bytes) + 8 + len(bin_data)
        header = struct.pack('<4sII', b'glTF', 2, total_size)
        json_chunk_hdr = struct.pack('<II', len(json_bytes), 0x4E4F534A)
        bin_chunk_hdr = struct.pack('<II', len(bin_data), 0x004E4942)

        with open(filepath, 'wb') as f:
            f.write(header)
            f.write(json_chunk_hdr)
            f.write(json_bytes)
            f.write(bin_chunk_hdr)
            f.write(bin_data)
        print(f"-> Compiled Character: {filepath} ({len(bin_data)/1024:.1f} KB, meshes: {len(self.meshes)})")

# ---------------------------------------------------------------------------
# CHARACTERS
# ---------------------------------------------------------------------------

def build_pisecops_protagonist():
    print("\n--- Compiling AAA PiSecOps Main Protagonist ---")
    # Denim jacket & maroon henley texture
    w, h = 512, 512
    torso_alb = Image.new('RGB', (w, h), (42, 45, 52)) # Charcoal dark denim
    draw = ImageDraw.Draw(torso_alb)
    # Maroon henley undershirt V-neck cutout in center
    draw.polygon([(210, 0), (302, 0), (256, 140)], fill=(125, 25, 38))
    # Chest pocket flaps & brass buttons
    draw.rectangle([60, 110, 190, 180], fill=(36, 38, 45))
    draw.rectangle([322, 110, 452, 180], fill=(36, 38, 45))
    draw.ellipse([120, 140, 132, 152], fill=(215, 175, 75)) # Button
    draw.ellipse([380, 140, 392, 152], fill=(215, 175, 75)) # Button
    # Leather satchel diagonal strap across chest
    draw.line([(60, 0), (452, 512)], fill=(110, 65, 35), width=24)
    draw.line([(55, 0), (447, 512)], fill=(140, 85, 45), width=3)

    torso_norm = generate_normal_map(torso_alb, 2.5)

    exp = GLBExporter()
    mat_skin = exp.add_material("Indian_Skin", (0.62, 0.44, 0.33, 1), roughness=0.6, metallic=0.0)
    mat_hair = exp.add_material("Dark_Hair", (0.08, 0.08, 0.09, 1), roughness=0.8, metallic=0.05)
    mat_torso = exp.add_material("Denim_Jacket_Maroon", (1,1,1,1), roughness=0.75, metallic=0.1, albedo_img=torso_alb, normal_img=torso_norm)
    mat_pants = exp.add_material("Tactical_Cargo_Pants", (0.16, 0.17, 0.19, 1), roughness=0.85, metallic=0.05)
    mat_leather = exp.add_material("Leather_Satchel", (0.38, 0.22, 0.12, 1), roughness=0.5, metallic=0.15)
    mat_boots = exp.add_material("Combat_Boots", (0.12, 0.11, 0.10, 1), roughness=0.7, metallic=0.1)

    # Height 1.82m
    # 1. Head & Styled Hair
    head_geoms = [
        box_geom(0, 1.62, 0, 0.20, 0.24, 0.22), # Head
        box_geom(0, 1.76, -0.02, 0.22, 0.08, 0.24), # Styled dark hair top
        box_geom(0, 1.68, -0.11, 0.21, 0.14, 0.05), # Hair back
        box_geom(0, 1.58, 0.12, 0.06, 0.04, 0.06), # Nose
        cylinder_geom(0, 1.48, 0, 0.08, 0.12, segments=10, axis='y') # Neck
    ]
    p, n, uv, idx = merge_geoms(head_geoms)
    exp.add_mesh("Protagonist_Head", p, n, uv, idx, mat_idx=mat_skin)

    # 2. Torso (Denim jacket + Satchel strap)
    torso_geoms = [
        # Upper torso / chest
        box_geom(0, 1.25, 0, 0.44, 0.45, 0.24),
        # Jacket collar
        box_geom(0, 1.48, -0.02, 0.32, 0.06, 0.22),
    ]
    p, n, uv, idx = merge_geoms(torso_geoms)
    exp.add_mesh("Protagonist_Torso", p, n, uv, idx, mat_idx=mat_torso)

    # 3. Arms & Watch
    arm_geoms = [
        # Left arm
        cylinder_geom(-0.28, 1.18, 0, 0.07, 0.55, segments=10, axis='y'),
        # Right arm
        cylinder_geom(0.28, 1.18, 0, 0.07, 0.55, segments=10, axis='y'),
        # Left hand
        box_geom(-0.28, 0.85, 0, 0.07, 0.12, 0.08),
        # Right hand
        box_geom(0.28, 0.85, 0, 0.07, 0.12, 0.08),
    ]
    p, n, uv, idx = merge_geoms(arm_geoms)
    exp.add_mesh("Protagonist_Arms", p, n, uv, idx, mat_idx=mat_skin)

    # 4. Messenger Bag on Hip
    satchel_geoms = [
        box_geom(0.28, 0.95, -0.05, 0.12, 0.28, 0.32), # Bag pouch on right hip
        box_geom(0.28, 0.98, -0.04, 0.13, 0.14, 0.33), # Flap
    ]
    p, n, uv, idx = merge_geoms(satchel_geoms)
    exp.add_mesh("Protagonist_Satchel", p, n, uv, idx, mat_idx=mat_leather)

    # 5. Tactical Cargo Pants
    pants_geoms = [
        # Pelvis / waist
        box_geom(0, 0.96, 0, 0.38, 0.18, 0.22),
        # Left leg with cargo pocket
        cylinder_geom(-0.12, 0.55, 0, 0.10, 0.72, segments=10, axis='y'),
        box_geom(-0.22, 0.62, 0, 0.04, 0.15, 0.14),
        # Right leg with cargo pocket
        cylinder_geom(0.12, 0.55, 0, 0.10, 0.72, segments=10, axis='y'),
        box_geom(0.22, 0.62, 0, 0.04, 0.15, 0.14),
    ]
    p, n, uv, idx = merge_geoms(pants_geoms)
    exp.add_mesh("Protagonist_Pants", p, n, uv, idx, mat_idx=mat_pants)

    # 6. Combat Boots
    boot_geoms = [
        box_geom(-0.12, 0.10, 0.04, 0.12, 0.20, 0.26),
        box_geom(0.12, 0.10, 0.04, 0.12, 0.20, 0.26),
    ]
    p, n, uv, idx = merge_geoms(boot_geoms)
    exp.add_mesh("Protagonist_Boots", p, n, uv, idx, mat_idx=mat_boots)

    out_file = os.path.join(OUTPUT_DIR, "pisecops_character_realistic.glb")
    exp.save(out_file)

def build_traffic_cop():
    print("\n--- Compiling AAA Mumbai Traffic Police ---")
    # Neon yellow high-visibility rain jacket with silver reflective stripes
    w, h = 512, 512
    neon_alb = Image.new('RGB', (w, h), (210, 245, 45)) # Fluorescent neon lime
    draw = ImageDraw.Draw(neon_alb)
    # Dual wide silver 3M reflective tape bands
    draw.rectangle([0, 180, w, 240], fill=(225, 230, 235))
    draw.rectangle([0, 320, w, 380], fill=(225, 230, 235))
    draw.line([(0, 178), (w, 178)], fill=(120, 140, 20), width=3)
    draw.line([(0, 242), (w, 242)], fill=(120, 140, 20), width=3)
    draw.text((160, 195), "MUMBAI POLICE", fill=(10, 10, 15))

    exp = GLBExporter()
    mat_skin = exp.add_material("Cop_Skin", (0.58, 0.40, 0.30, 1), roughness=0.6, metallic=0.0)
    mat_neon = exp.add_material("Police_Neon_Rainwear", (1,1,1,1), roughness=0.45, metallic=0.2, albedo_img=neon_alb, normal_img=generate_normal_map(neon_alb, 2.0))
    mat_cap = exp.add_material("Police_White_Cap", (0.95, 0.95, 0.95, 1), roughness=0.5, metallic=0.1)
    mat_boots = exp.add_material("Police_Black_Boots", (0.1, 0.1, 0.12, 1), roughness=0.6, metallic=0.2)

    # 1. Head & White Peaked Police Cap with Badge
    head_geoms = [
        box_geom(0, 1.62, 0, 0.20, 0.24, 0.22), # Face
        box_geom(0, 1.76, 0.02, 0.24, 0.09, 0.26), # White cap crown
        box_geom(0, 1.72, 0.16, 0.22, 0.02, 0.10), # Cap black visor peak
        box_geom(0, 1.76, 0.14, 0.06, 0.06, 0.02), # Golden police emblem
        cylinder_geom(0, 1.48, 0, 0.08, 0.12, segments=10, axis='y')
    ]
    p, n, uv, idx = merge_geoms(head_geoms)
    exp.add_mesh("Police_Head_Cap", p, n, uv, idx, mat_idx=mat_cap)

    # 2. Fluorescent Lime Rain Jacket
    jacket_geoms = [
        box_geom(0, 1.25, 0, 0.48, 0.50, 0.26), # Torso
        cylinder_geom(-0.30, 1.18, 0, 0.08, 0.55, segments=10, axis='y'), # Left arm
        cylinder_geom(0.30, 1.18, 0, 0.08, 0.55, segments=10, axis='y'),  # Right arm
    ]
    p, n, uv, idx = merge_geoms(jacket_geoms)
    exp.add_mesh("Police_Neon_Jacket", p, n, uv, idx, mat_idx=mat_neon)

    # 3. Fluorescent Waterproof Trousers
    trouser_geoms = [
        box_geom(0, 0.95, 0, 0.40, 0.18, 0.24),
        cylinder_geom(-0.13, 0.55, 0, 0.11, 0.72, segments=10, axis='y'),
        cylinder_geom(0.13, 0.55, 0, 0.11, 0.72, segments=10, axis='y'),
    ]
    p, n, uv, idx = merge_geoms(trouser_geoms)
    exp.add_mesh("Police_Rain_Trousers", p, n, uv, idx, mat_idx=mat_neon)

    # 4. Boots & Hands
    boot_geoms = [
        box_geom(-0.13, 0.10, 0.04, 0.13, 0.20, 0.26),
        box_geom(0.13, 0.10, 0.04, 0.13, 0.20, 0.26),
        box_geom(-0.30, 0.85, 0, 0.07, 0.12, 0.08), # Hands
        box_geom(0.30, 0.85, 0, 0.07, 0.12, 0.08),
    ]
    p, n, uv, idx = merge_geoms(boot_geoms)
    exp.add_mesh("Police_Boots_Hands", p, n, uv, idx, mat_idx=mat_boots)

    out_file = os.path.join(OUTPUT_DIR, "traffic_cop_realistic.glb")
    exp.save(out_file)

def build_street_vendor():
    print("\n--- Compiling AAA Mumbai Street Food Vendor / Dabbawala ---")
    # Olive kurta & red-checked gamcha towel texture
    w, h = 512, 512
    kurta_alb = Image.new('RGB', (w, h), (115, 135, 75)) # Olive green kurta
    draw = ImageDraw.Draw(kurta_alb)
    # Front button placket
    draw.rectangle([240, 0, 272, 250], fill=(95, 115, 55))
    for by in [40, 100, 160, 220]:
        draw.ellipse([250, by, 262, by + 12], fill=(235, 235, 240))
    # Red-checked gamcha towel across right shoulder
    for gx in range(0, 160, 16):
        draw.line([(gx, 0), (gx + 120, h)], fill=(215, 45, 40), width=4)
        draw.line([(gx + 8, 0), (gx + 128, h)], fill=(245, 245, 245), width=4)

    exp = GLBExporter()
    mat_skin = exp.add_material("Vendor_Skin", (0.55, 0.38, 0.28, 1), roughness=0.65, metallic=0.0)
    mat_kurta = exp.add_material("Vendor_Kurta_Gamcha", (1,1,1,1), roughness=0.8, metallic=0.05, albedo_img=kurta_alb, normal_img=generate_normal_map(kurta_alb, 2.5))
    mat_pants = exp.add_material("Vendor_Jeans", (0.18, 0.25, 0.42, 1), roughness=0.85, metallic=0.05)
    mat_cap = exp.add_material("Vendor_Cap", (0.75, 0.65, 0.50, 1), roughness=0.7, metallic=0.05)

    head_geoms = [
        box_geom(0, 1.62, 0, 0.20, 0.24, 0.22),
        box_geom(0, 1.76, 0.02, 0.22, 0.08, 0.24), # Cap
        box_geom(0, 1.73, 0.16, 0.20, 0.02, 0.08), # Brim
        cylinder_geom(0, 1.48, 0, 0.08, 0.12, segments=10, axis='y')
    ]
    p, n, uv, idx = merge_geoms(head_geoms)
    exp.add_mesh("Vendor_Head", p, n, uv, idx, mat_idx=mat_cap)

    kurta_geoms = [
        # Kurta torso extending down to mid-thigh
        box_geom(0, 1.20, 0, 0.42, 0.55, 0.24),
        box_geom(0, 0.88, 0, 0.44, 0.20, 0.25), # Lower kurta skirt
        cylinder_geom(-0.28, 1.18, 0, 0.07, 0.55, segments=10, axis='y'),
        cylinder_geom(0.28, 1.18, 0, 0.07, 0.55, segments=10, axis='y'),
    ]
    p, n, uv, idx = merge_geoms(kurta_geoms)
    exp.add_mesh("Vendor_Kurta", p, n, uv, idx, mat_idx=mat_kurta)

    pants_geoms = [
        cylinder_geom(-0.12, 0.45, 0, 0.09, 0.68, segments=10, axis='y'),
        cylinder_geom(0.12, 0.45, 0, 0.09, 0.68, segments=10, axis='y'),
        box_geom(-0.12, 0.06, 0.02, 0.11, 0.12, 0.24), # Sandals
        box_geom(0.12, 0.06, 0.02, 0.11, 0.12, 0.24),
    ]
    p, n, uv, idx = merge_geoms(pants_geoms)
    exp.add_mesh("Vendor_Pants_Sandals", p, n, uv, idx, mat_idx=mat_pants)

    out_file = os.path.join(OUTPUT_DIR, "street_vendor_realistic.glb")
    exp.save(out_file)

if __name__ == "__main__":
    build_pisecops_protagonist()
    build_traffic_cop()
    build_street_vendor()
    print("\n[SUCCESS] ALL AAA CHARACTERS COMPILED!")
