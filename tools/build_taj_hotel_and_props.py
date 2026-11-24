"""
build_taj_hotel_and_props.py
============================
Creates an architecturally accurate 3D model of The Taj Mahal Palace Hotel (Colaba, Mumbai)
located directly across from Gateway of India at Apollo Bunder.
Outputs: public/assets/buildings/taj_mahal_palace_hotel.glb
"""

import os
import io
import math
import struct
import json
import numpy as np
from PIL import Image, ImageDraw

def create_taj_facade_texture():
    """Generates authentic basalt & yellow-stone Victorian Gothic facade texture."""
    w, h = 1024, 1024
    # Warm Mumbai Saracenic yellow sandstone base
    img = Image.new('RGB', (w, h), (195, 160, 115))
    d = ImageDraw.Draw(img)

    # Masonry stone block courses
    for y in range(0, h, 32):
        d.line([(0, y), (w, y)], fill=(155, 125, 85), width=2)
        # Staggered vertical joints
        offset = 0 if (y // 32) % 2 == 0 else 32
        for x in range(offset, w, 64):
            d.line([(x, y), (x, y + 32)], fill=(155, 125, 85), width=1)

    # Arched windows in rows
    for row in range(4):
        wy = 120 + row * 220
        for col in range(8):
            wx = 40 + col * 120
            # Window frame & dark reflective glass
            d.rectangle([wx, wy + 20, wx + 60, wy + 140], fill=(25, 35, 45))
            d.pieslice([wx, wy, wx + 60, wy + 60], 180, 360, fill=(25, 35, 45))
            # White stone mullions & trim
            d.rectangle([wx - 4, wy + 138, wx + 64, wy + 144], fill=(235, 225, 215)) # sill
            d.arc([wx - 2, wy - 2, wx + 62, wy + 62], 180, 360, fill=(240, 230, 220), width=4)
            # Glass panes
            d.line([(wx + 30, wy + 20), (wx + 30, wy + 138)], fill=(120, 150, 180), width=2)
            d.line([(wx + 2, wy + 80), (wx + 58, wy + 80)], fill=(120, 150, 180), width=2)

    # Balconies with ornate railings
    for row in range(3):
        by = 260 + row * 220
        for col in range(8):
            bx = 32 + col * 120
            d.rectangle([bx, by, bx + 76, by + 12], fill=(210, 180, 135))
            for rx in range(bx + 4, bx + 74, 8):
                d.line([(rx, by - 18), (rx, by)], fill=(40, 35, 35), width=2)
            d.line([(bx + 2, by - 18), (bx + 74, by - 18)], fill=(40, 35, 35), width=3)

    # Top cornice molding
    d.rectangle([0, 0, w, 40], fill=(225, 195, 150))
    d.line([(0, 38), (w, 38)], fill=(140, 110, 75), width=3)

    return img

def create_taj_dome_texture():
    """Generates rich terracotta red dome texture with copper ribs."""
    w, h = 512, 512
    img = Image.new('RGB', (w, h), (175, 45, 35)) # Classic Taj red dome
    d = ImageDraw.Draw(img)
    # Vertical copper ribs
    for x in range(0, w, 32):
        d.line([(x, 0), (x, h)], fill=(215, 160, 50), width=3)
        d.line([(x + 2, 0), (x + 2, h)], fill=(120, 30, 20), width=2)
    # Decorative banding
    d.rectangle([0, 440, w, 512], fill=(220, 190, 140))
    for x in range(0, w, 24):
        d.arc([x, 445, x + 24, 475], 0, 180, fill=(160, 120, 70), width=2)
    return img

def build_taj_hotel():
    out_dir = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public\assets\buildings"
    os.makedirs(out_dir, exist_ok=True)
    out_glb = os.path.join(out_dir, "taj_mahal_palace_hotel.glb")

    vertices = []
    normals = []
    uvs = []
    indices_walls = []
    indices_dome = []
    indices_roof = []

    def add_quad(v0, v1, v2, v3, norm, uv_box, idx_list):
        start = len(vertices)
        for v in [v0, v1, v2, v3]:
            vertices.append(v)
            normals.append(norm)
        uvs.extend([
            [uv_box[0], uv_box[3]],
            [uv_box[2], uv_box[3]],
            [uv_box[2], uv_box[1]],
            [uv_box[0], uv_box[1]]
        ])
        idx_list.extend([start, start + 1, start + 2, start, start + 2, start + 3])

    def add_box(center, size, idx_list, uv_tiling=1.0):
        cx, cy, cz = center
        sx, sy, sz = size[0]/2, size[1]/2, size[2]/2
        # Front (+Z)
        add_quad([cx-sx, cy-sy, cz+sz], [cx+sx, cy-sy, cz+sz], [cx+sx, cy+sy, cz+sz], [cx-sx, cy+sy, cz+sz], [0, 0, 1], [0, 0, uv_tiling, 1], idx_list)
        # Back (-Z)
        add_quad([cx+sx, cy-sy, cz-sz], [cx-sx, cy-sy, cz-sz], [cx-sx, cy+sy, cz-sz], [cx+sx, cy+sy, cz-sz], [0, 0, -1], [0, 0, uv_tiling, 1], idx_list)
        # Left (-X)
        add_quad([cx-sx, cy-sy, cz-sz], [cx-sx, cy-sy, cz+sz], [cx-sx, cy+sy, cz+sz], [cx-sx, cy+sy, cz-sz], [-1, 0, 0], [0, 0, uv_tiling, 1], idx_list)
        # Right (+X)
        add_quad([cx+sx, cy-sy, cz+sz], [cx+sx, cy-sy, cz-sz], [cx+sx, cy+sy, cz-sz], [cx+sx, cy+sy, cz+sz], [1, 0, 0], [0, 0, uv_tiling, 1], idx_list)
        # Top (+Y)
        add_quad([cx-sx, cy+sy, cz+sz], [cx+sx, cy+sy, cz+sz], [cx+sx, cy+sy, cz-sz], [cx-sx, cy+sy, cz-sz], [0, 1, 0], [0, 0, 1, 1], indices_roof)
        # Bottom (-Y)
        add_quad([cx-sx, cy-sy, cz-sz], [cx+sx, cy-sy, cz-sz], [cx+sx, cy-sy, cz+sz], [cx-sx, cy-sy, cz+sz], [0, -1, 0], [0, 0, 1, 1], indices_roof)

    def add_dome(center, radius, height, segments=24):
        cx, cy, cz = center
        start_idx = len(vertices)
        
        # Profile points for an authentic Moorish onion dome
        profile = []
        rings = 14
        for r in range(rings + 1):
            t = r / rings
            # Onion shape curve: bulging in middle, tapering to sharp needle at top
            if t < 0.2:
                # Drum base
                rad = radius * (1.0 + t * 0.1)
                y = t * height * 0.2
            elif t < 0.7:
                # Main swell
                rad = radius * (1.02 + 0.28 * math.sin((t - 0.2) / 0.5 * math.pi))
                y = (0.2 + (t - 0.2) * 0.6) * height
            else:
                # Fluting taper to finial spire
                rem = (t - 0.7) / 0.3
                rad = radius * (1.0 - rem * 0.95)
                y = (0.5 + rem * 0.5) * height
            profile.append((rad, y))

        for r_idx, (rad, py) in enumerate(profile):
            for s in range(segments):
                theta = (s / segments) * 2.0 * math.pi
                px = cx + rad * math.cos(theta)
                pz = cz + rad * math.sin(theta)
                ny = 0.2 if r_idx > 8 else 0.0
                nx = math.cos(theta)
                nz = math.sin(theta)
                norm = [nx, ny, nz]
                norm_len = math.hypot(nx, ny, nz)
                norm = [nx/norm_len, ny/norm_len, nz/norm_len]
                vertices.append([px, cy + py, pz])
                normals.append(norm)
                uvs.append([s / segments, r_idx / rings])

        for r_idx in range(rings):
            for s in range(segments):
                next_s = (s + 1) % segments
                v00 = start_idx + r_idx * segments + s
                v01 = start_idx + r_idx * segments + next_s
                v10 = start_idx + (r_idx + 1) * segments + s
                v11 = start_idx + (r_idx + 1) * segments + next_s
                indices_dome.extend([v00, v10, v01, v01, v10, v11])

    # 1. Main Central Palace Block (Width 76m, Height 26m, Depth 34m)
    add_box([0, 13, 0], [76, 26, 34], indices_walls, uv_tiling=4.0)

    # 2. Left & Right Forward Wings (U-shaped courtyard facing Gateway)
    # Left Wing
    add_box([-46, 12, 12], [24, 24, 58], indices_walls, uv_tiling=3.0)
    # Right Wing
    add_box([46, 12, 12], [24, 24, 58], indices_walls, uv_tiling=3.0)

    # 3. Central Grand Porch / Portico
    add_box([0, 4, 20], [28, 8, 8], indices_walls, uv_tiling=1.5)

    # 4. Central Tower Podium
    add_box([0, 28, 0], [22, 6, 22], indices_walls, uv_tiling=1.5)

    # 5. Iconic Central Taj Red Onion Dome (Radius 10m, Height 16m)
    add_dome([0, 31, 0], radius=9.5, height=17.0, segments=32)

    # 6. Four Corner Turret Cupolas / Domes
    corner_positions = [
        [-34, 26, 14], [34, 26, 14],
        [-54, 24, 38], [54, 24, 38]
    ]
    for cpos in corner_positions:
        add_box([cpos[0], cpos[1] + 2, cpos[2]], [7, 4, 7], indices_walls, uv_tiling=1.0)
        add_dome([cpos[0], cpos[1] + 4, cpos[2]], radius=3.2, height=6.5, segments=20)

    # Encode textures
    facade_img = create_taj_facade_texture()
    dome_img = create_taj_dome_texture()
    
    buf_facade = io.BytesIO()
    facade_img.save(buf_facade, format='PNG')
    facade_png = buf_facade.getvalue()

    buf_dome = io.BytesIO()
    dome_img.save(buf_dome, format='PNG')
    dome_png = buf_dome.getvalue()

    # GLB binary packaging
    varr = np.array(vertices, dtype=np.float32)
    narr = np.array(normals, dtype=np.float32)
    uarr = np.array(uvs, dtype=np.float32)
    i_walls = np.array(indices_walls, dtype=np.uint32)
    i_dome = np.array(indices_dome, dtype=np.uint32)
    i_roof = np.array(indices_roof, dtype=np.uint32)

    def pad4(b):
        pad = (4 - (len(b) % 4)) % 4
        return b + b'\x00' * pad

    v_b = pad4(varr.tobytes())
    n_b = pad4(narr.tobytes())
    u_b = pad4(uarr.tobytes())
    iw_b = pad4(i_walls.tobytes())
    id_b = pad4(i_dome.tobytes())
    ir_b = pad4(i_roof.tobytes())
    tex_facade_b = pad4(facade_png)
    tex_dome_b = pad4(dome_png)

    bin_data = v_b + n_b + u_b + iw_b + id_b + ir_b + tex_facade_b + tex_dome_b

    off_v = 0
    off_n = len(v_b)
    off_u = off_n + len(n_b)
    off_iw = off_u + len(u_b)
    off_id = off_iw + len(iw_b)
    off_ir = off_id + len(id_b)
    off_tf = off_ir + len(ir_b)
    off_td = off_tf + len(tex_facade_b)

    gltf = {
        "asset": {"version": "2.0", "generator": "Taj Mahal Palace 3D Generator"},
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": "The_Taj_Mahal_Palace_Hotel", "mesh": 0}],
        "images": [
            {"bufferView": 6, "mimeType": "image/png"},
            {"bufferView": 7, "mimeType": "image/png"}
        ],
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
        "textures": [
            {"sampler": 0, "source": 0},
            {"sampler": 0, "source": 1}
        ],
        "materials": [
            {
                "name": "Taj_Sandstone_Facade",
                "pbrMetallicRoughness": {
                    "baseColorTexture": {"index": 0},
                    "roughnessFactor": 0.82,
                    "metallicFactor": 0.05
                }
            },
            {
                "name": "Taj_Terracotta_Dome",
                "pbrMetallicRoughness": {
                    "baseColorTexture": {"index": 1},
                    "roughnessFactor": 0.45,
                    "metallicFactor": 0.35
                },
                "emissiveFactor": [0.15, 0.05, 0.02]
            },
            {
                "name": "Taj_Roof_Terrace",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.42, 0.38, 0.34, 1.0],
                    "roughnessFactor": 0.9,
                    "metallicFactor": 0.1
                }
            }
        ],
        "meshes": [
            {
                "name": "Taj_Hotel_Mesh",
                "primitives": [
                    {"attributes": {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2}, "indices": 3, "material": 0},
                    {"attributes": {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2}, "indices": 4, "material": 1},
                    {"attributes": {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2}, "indices": 5, "material": 2}
                ]
            }
        ],
        "accessors": [
            {"bufferView": 0, "byteOffset": 0, "componentType": 5126, "count": len(varr), "type": "VEC3", "min": varr.min(axis=0).tolist(), "max": varr.max(axis=0).tolist()},
            {"bufferView": 1, "byteOffset": 0, "componentType": 5126, "count": len(narr), "type": "VEC3", "min": narr.min(axis=0).tolist(), "max": narr.max(axis=0).tolist()},
            {"bufferView": 2, "byteOffset": 0, "componentType": 5126, "count": len(uarr), "type": "VEC2", "min": [0,0], "max": [4,1]},
            {"bufferView": 3, "byteOffset": 0, "componentType": 5125, "count": len(i_walls), "type": "SCALAR", "min": [int(i_walls.min())], "max": [int(i_walls.max())]},
            {"bufferView": 4, "byteOffset": 0, "componentType": 5125, "count": len(i_dome), "type": "SCALAR", "min": [int(i_dome.min())], "max": [int(i_dome.max())]},
            {"bufferView": 5, "byteOffset": 0, "componentType": 5125, "count": len(i_roof), "type": "SCALAR", "min": [int(i_roof.min())], "max": [int(i_roof.max())]}
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": off_v, "byteLength": len(varr.tobytes()), "target": 34962},
            {"buffer": 0, "byteOffset": off_n, "byteLength": len(narr.tobytes()), "target": 34962},
            {"buffer": 0, "byteOffset": off_u, "byteLength": len(uarr.tobytes()), "target": 34962},
            {"buffer": 0, "byteOffset": off_iw, "byteLength": len(i_walls.tobytes()), "target": 34963},
            {"buffer": 0, "byteOffset": off_id, "byteLength": len(i_dome.tobytes()), "target": 34963},
            {"buffer": 0, "byteOffset": off_ir, "byteLength": len(i_roof.tobytes()), "target": 34963},
            {"buffer": 0, "byteOffset": off_tf, "byteLength": len(facade_png)},
            {"buffer": 0, "byteOffset": off_td, "byteLength": len(dome_png)}
        ],
        "buffers": [{"byteLength": len(bin_data)}]
    }


    json_str = json.dumps(gltf).encode('utf-8')
    json_pad = (4 - (len(json_str) % 4)) % 4
    json_bytes = json_str + b' ' * json_pad

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_data)
    with open(out_glb, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total_len))
        f.write(struct.pack('<II', len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack('<II', len(bin_data), 0x004E4942))
        f.write(bin_data)

    print(f"Generated {out_glb} (size: {os.path.getsize(out_glb)} bytes)")

if __name__ == '__main__':

    build_taj_hotel()
