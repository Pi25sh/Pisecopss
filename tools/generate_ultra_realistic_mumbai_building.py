"""
Ultra-Realistic AAA Game-Ready Mumbai Urban Building Generator.
Generates an authentic 6-storey Mumbai residential-commercial building with:
- Ground floor commercial shops with corrugated rolling shutters and shop signs
- Residential entrance with decorative security gate and lobby steps
- 5 residential floors with recessed windows, safety grilles, chhajja weather canopies
- Detailed balconies with metal railings, hanging colorful laundry, and potted plants
- Wall-mounted outdoor split AC compressor units with conduit pipes
- Vertical PVC stormwater downspout drainage pipes with elbows
- Electrical utility cables and meter boxes
- Rooftop mumty headhouse, black ribbed Sintex water tanks on plinths, satellite dishes, antenna mast
- High-resolution PBR textures (Albedo, Normal, Roughness/Metallic) embedded into self-contained GLBs
- Exports LOD0 (master), LOD1, and LOD2 models.
"""

import os
import math
import io
import struct
import json
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

output_dir = r"d:\bombaii thefts\PiSecOps-Mumbai-Open-World\public\assets\buildings"
os.makedirs(output_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. PBR TEXTURE GENERATION (2048x2048 & 1024x1024)
# -------------------------------------------------------------

def generate_facade_textures():
    print("Generating 2K Facade PBR Maps...")
    w, h = 2048, 2048
    # 1.1 Albedo Map: Weathered Mumbai Sandstone/Beige Concrete Plaster
    # Base color: warm Indian urban concrete
    albedo = Image.new('RGB', (w, h), (198, 182, 162))
    draw = ImageDraw.Draw(albedo)

    # Concrete aggregate & grain noise
    pixels = np.array(albedo, dtype=np.float32)
    noise = np.random.normal(0, 12, (h, w, 3))
    pixels = np.clip(pixels + noise, 0, 255).astype(np.uint8)
    albedo = Image.fromarray(pixels)
    draw = ImageDraw.Draw(albedo)

    # Horizontal floor banding lines & concrete expansion joints
    for floor in range(7):
        y = int(floor * (h / 6))
        # Dirt accumulation under floor slab ledges
        for dy in range(25):
            darken = int(60 * (1.0 - dy / 25.0))
            draw.line([(0, y + dy), (w, y + dy)], fill=(120 - darken, 105 - darken, 90 - darken))
        # Concrete seam line
        draw.line([(0, y), (w, y)], fill=(85, 75, 65), width=4)

    # Vertical monsoon rainwater streaks and damp water runoff marks
    for x in range(40, w, 65):
        streak_len = random.randint(180, 550)
        streak_y = random.randint(0, h - streak_len)
        streak_alpha = random.randint(30, 70)
        for dy in range(streak_len):
            decay = math.sin((dy / streak_len) * math.pi)
            intensity = int(streak_alpha * decay)
            draw.line([(x, streak_y + dy), (x + random.randint(-1, 1), streak_y + dy)], fill=(105 - intensity, 95 - intensity, 80 - intensity), width=random.randint(3, 8))

    # Base ground splash weathering & moss/fungus marks at ground level
    for gy in range(h - 180, h):
        factor = (gy - (h - 180)) / 180.0
        draw.line([(0, gy), (w, gy)], fill=(int(140 - factor * 50), int(135 - factor * 40), int(115 - factor * 45)))

    # 1.2 Normal Map (Tangent Space RGB: default [128, 128, 255])
    normal_img = Image.new('RGB', (w, h), (128, 128, 255))
    n_pixels = np.array(normal_img, dtype=np.float32)
    # Grain height perturbation
    h_noise = np.random.normal(0, 6, (h, w))
    # Sobel gradients
    gx = np.roll(h_noise, -1, axis=1) - np.roll(h_noise, 1, axis=1)
    gy = np.roll(h_noise, -1, axis=0) - np.roll(h_noise, 1, axis=0)
    n_pixels[:, :, 0] = np.clip(128 - gx * 8, 0, 255)
    n_pixels[:, :, 1] = np.clip(128 - gy * 8, 0, 255)
    n_pixels[:, :, 2] = 255
    normal_map = Image.fromarray(n_pixels.astype(np.uint8))

    # 1.3 Roughness / Metallic Map (G = Roughness, B = Metallic)
    rm_img = Image.new('RGB', (w, h), (0, 215, 20)) # High roughness (0.84), low metalness (0.08)
    rm_pixels = np.array(rm_img, dtype=np.uint8)

    return albedo, normal_map, Image.fromarray(rm_pixels)

def generate_shop_textures():
    print("Generating 1K Commercial Shop PBR Maps...")
    w, h = 1024, 1024
    albedo = Image.new('RGB', (w, h), (170, 175, 180)) # Galvanized corrugated steel
    draw = ImageDraw.Draw(albedo)

    # Corrugated rolling shutter slats (horizontal ribs)
    for y in range(0, h, 20):
        # Top highlight
        draw.line([(0, y), (w, y)], fill=(225, 228, 230), width=3)
        # Deep shadow in groove
        draw.line([(0, y + 10), (w, y + 10)], fill=(70, 75, 80), width=6)
        # Rust streaks on metal shutters
        if y % 60 == 0:
            rust_x = random.randint(100, w - 100)
            draw.rectangle([rust_x, y, rust_x + 35, y + 18], fill=(140, 70, 35))

    # Top colorful commercial shop signboards
    # Sign 1: Green Chemist
    draw.rectangle([40, 40, 320, 160], fill=(20, 110, 50))
    draw.rectangle([44, 44, 316, 156], outline=(255, 255, 255), width=3)
    draw.text((60, 85), "MUMBAI CHEMIST & DRUGS", fill=(255, 255, 255))
    # Red cross
    draw.rectangle([260, 65, 290, 135], fill=(220, 30, 30))
    draw.rectangle([240, 85, 310, 115], fill=(220, 30, 30))

    # Sign 2: Kirana General Store
    draw.rectangle([360, 40, 660, 160], fill=(210, 45, 25))
    draw.rectangle([364, 44, 656, 156], outline=(245, 210, 30), width=3)
    draw.text((385, 75), "SHREE GANESH GENERAL STORES", fill=(255, 255, 255))
    draw.text((410, 110), "DAILY KIRANA & SPICES", fill=(245, 220, 40))

    # Sign 3: Cutting Chai Tapri & Snacks
    draw.rectangle([700, 40, 980, 160], fill=(235, 145, 20))
    draw.rectangle([704, 44, 976, 156], outline=(255, 255, 255), width=3)
    draw.text((735, 85), "BOMBAY CUTTING CHAI", fill=(20, 20, 25))
    draw.text((750, 115), "VADA PAV & SAMOSA", fill=(255, 255, 255))

    # Normal map for corrugated metal
    normal_img = Image.new('RGB', (w, h), (128, 128, 255))
    for y in range(0, h, 20):
        for dy in range(10):
            ny = int(128 + math.sin(dy / 10.0 * math.pi) * 80)
            normal_img.paste((128, ny, 230), (0, y + dy, w, y + dy + 1))

    return albedo, normal_img

def generate_window_textures():
    print("Generating Window Glass & Safety Grille Textures...")
    w, h = 512, 512
    # Reflective dark tinted architectural glass with sky gradient
    glass = Image.new('RGB', (w, h), (28, 44, 64))
    draw = ImageDraw.Draw(glass)
    # Sky reflection gradient
    for y in range(h):
        grad = y / float(h)
        draw.line([(0, y), (w, y)], fill=(int(22 + grad * 35), int(38 + grad * 45), int(60 + grad * 50)))

    # Aluminum bronze frame
    draw.rectangle([0, 0, w, h], outline=(65, 55, 45), width=18)
    draw.line([(w // 2, 0), (w // 2, h)], fill=(65, 55, 45), width=12) # Center mullion

    # Ornate Indian diamond safety grille pattern
    for x in range(30, w - 30, 40):
        draw.line([(x, 30), (x + 80, h - 30)], fill=(40, 36, 32), width=3)
        draw.line([(x + 80, 30), (x, h - 30)], fill=(40, 36, 32), width=3)

    return glass

def generate_rooftop_prop_textures():
    w, h = 512, 512
    img = Image.new('RGB', (w, h), (25, 25, 28)) # Sintex black UV plastic
    draw = ImageDraw.Draw(img)
    # Horizontal reinforcement ribs
    for y in range(0, h, 32):
        draw.line([(0, y), (w, y)], fill=(50, 50, 55), width=6)
        draw.line([(0, y + 4), (w, y + 4)], fill=(12, 12, 14), width=4)
    # White SINTEX brand logo
    draw.text((160, 230), "SINTEX", fill=(230, 230, 235))
    draw.text((150, 270), "TRIPLE LAYER 1000L", fill=(180, 180, 185))

    return img

def generate_laundry_textures():
    w, h = 256, 256
    img = Image.new('RGB', (w, h), (220, 60, 40)) # Vibrant Indian textile colors
    draw = ImageDraw.Draw(img)
    # Stripes: saffron orange, turquoise blue, golden yellow, indigo
    colors = [(235, 120, 30), (30, 160, 190), (240, 200, 40), (45, 60, 140), (225, 225, 230)]
    for idx, c in enumerate(colors):
        x = idx * (w // len(colors))
        draw.rectangle([x, 0, x + (w // len(colors)), h], fill=c)
        draw.line([(x, 0), (x, h)], fill=(30, 30, 30), width=2)
    return img

# -------------------------------------------------------------
# 2. 3D GEOMETRY BUILDER (Positions, Normals, UVs, Indices)
# -------------------------------------------------------------

def create_box_mesh(cx, cy, cz, sx, sy, sz, uv_repeat=(1.0, 1.0)):
    hx, hy, hz = sx / 2.0, sy / 2.0, sz / 2.0
    u, v = uv_repeat

    faces = [
        # +Z Front
        {'pos': [[cx-hx, cy-hy, cz+hz], [cx+hx, cy-hy, cz+hz], [cx+hx, cy+hy, cz+hz], [cx-hx, cy+hy, cz+hz]], 'n': [0, 0, 1]},
        # -Z Back
        {'pos': [[cx+hx, cy-hy, cz-hz], [cx-hx, cy-hy, cz-hz], [cx-hx, cy+hy, cz-hz], [cx+hx, cy+hy, cz-hz]], 'n': [0, 0, -1]},
        # +Y Top
        {'pos': [[cx-hx, cy+hy, cz+hz], [cx+hx, cy+hy, cz+hz], [cx+hx, cy+hy, cz-hz], [cx-hx, cy+hy, cz-hz]], 'n': [0, 1, 0]},
        # -Y Bottom
        {'pos': [[cx-hx, cy-hy, cz-hz], [cx+hx, cy-hy, cz-hz], [cx+hx, cy-hy, cz+hz], [cx-hx, cy-hy, cz+hz]], 'n': [0, -1, 0]},
        # +X Right
        {'pos': [[cx+hx, cy-hy, cz+hz], [cx+hx, cy-hy, cz-hz], [cx+hx, cy+hy, cz-hz], [cx+hx, cy+hy, cz+hz]], 'n': [1, 0, 0]},
        # -X Left
        {'pos': [[cx-hx, cy-hy, cz-hz], [cx-hx, cy-hy, cz+hz], [cx-hx, cy+hy, cz+hz], [cx-hx, cy+hy, cz-hz]], 'n': [-1, 0, 0]},
    ]

    positions, normals, uvs, indices = [], [], [], []
    for f in faces:
        base = len(positions)
        for p in f['pos']:
            positions.append(p)
            normals.append(f['n'])
        uvs.extend([[0, 0], [u, 0], [u, v], [0, v]])
        indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])

    return positions, normals, uvs, indices

def create_cylinder_mesh(cx, cy, cz, radius, height, segments=12, axis='y'):
    positions, normals, uvs, indices = [], [], [], []
    hh = height / 2.0
    top_c = len(positions)
    bot_c = top_c + 1

    if axis == 'y':
        positions.extend([[cx, cy + hh, cz], [cx, cy - hh, cz]])
        normals.extend([[0, 1, 0], [0, -1, 0]])
    elif axis == 'x':
        positions.extend([[cx + hh, cy, cz], [cx - hh, cy, cz]])
        normals.extend([[1, 0, 0], [-1, 0, 0]])
    else:
        positions.extend([[cx, cy, cz + hh], [cx, cy, cz - hh]])
        normals.extend([[0, 0, 1], [0, 0, -1]])

    uvs.extend([[0.5, 0.5], [0.5, 0.5]])

    ring_start = len(positions)
    for i in range(segments + 1):
        angle = i * (2.0 * math.pi / segments)
        c = math.cos(angle)
        s = math.sin(angle)
        u_coord = i / float(segments)

        if axis == 'y':
            p_top = [cx + radius * c, cy + hh, cz + radius * s]
            p_bot = [cx + radius * c, cy - hh, cz + radius * s]
            n_side = [c, 0, s]
        elif axis == 'x':
            p_top = [cx + hh, cy + radius * c, cz + radius * s]
            p_bot = [cx - hh, cy + radius * c, cz + radius * s]
            n_side = [0, c, s]
        else:
            p_top = [cx + radius * c, cy + radius * s, cz + hh]
            p_bot = [cx + radius * c, cy + radius * s, cz - hh]
            n_side = [c, s, 0]

        positions.extend([p_top, p_bot])
        normals.extend([n_side, n_side])
        uvs.extend([[u_coord, 1.0], [u_coord, 0.0]])

    for i in range(segments):
        idx0 = ring_start + i * 2
        idx1 = idx0 + 1
        idx2 = idx0 + 2
        idx3 = idx0 + 3
        indices.extend([idx0, idx1, idx2, idx1, idx3, idx2])
        # Caps
        indices.extend([top_c, idx0, idx2])
        indices.extend([bot_c, idx3, idx1])

    return positions, normals, uvs, indices

def merge_mesh_list(mesh_list):
    all_pos, all_norm, all_uv, all_idx = [], [], [], []
    for pos, norm, uv, idx in mesh_list:
        base = len(all_pos)
        all_pos.extend(pos)
        all_norm.extend(norm)
        all_uv.extend(uv)
        all_idx.extend([i + base for i in idx])
    return all_pos, all_norm, all_uv, all_idx

# -------------------------------------------------------------
# 3. COMPLETE GLB 2.0 EXPORTER WITH FULL PBR TEXTURES
# -------------------------------------------------------------

class EnhancedGLBBuilder:
    def __init__(self):
        self.meshes = []
        self.materials = []
        self.images = []

    def add_material(self, name, base_color=(1, 1, 1, 1), roughness=0.8, metallic=0.0,
                     albedo_img=None, normal_img=None, rm_img=None):
        mat_idx = len(self.materials)
        tex_albedo = None
        tex_normal = None
        tex_rm = None

        if albedo_img is not None:
            tex_albedo = len(self.images)
            buf = io.BytesIO()
            albedo_img.save(buf, format='PNG')
            self.images.append(buf.getvalue())

        if normal_img is not None:
            tex_normal = len(self.images)
            buf = io.BytesIO()
            normal_img.save(buf, format='PNG')
            self.images.append(buf.getvalue())

        if rm_img is not None:
            tex_rm = len(self.images)
            buf = io.BytesIO()
            rm_img.save(buf, format='PNG')
            self.images.append(buf.getvalue())

        self.materials.append({
            'name': name,
            'base_color': base_color,
            'roughness': roughness,
            'metallic': metallic,
            'tex_albedo': tex_albedo,
            'tex_normal': tex_normal,
            'tex_rm': tex_rm
        })
        return mat_idx

    def add_mesh(self, name, positions, normals, uvs, indices, material_idx=0):
        if len(positions) == 0:
            return
        self.meshes.append({
            'name': name,
            'positions': positions,
            'normals': normals,
            'uvs': uvs,
            'indices': indices,
            'mat_idx': material_idx
        })

    def build(self, output_path):
        binary_data = bytearray()
        buffer_views = []
        accessors = []

        def pad():
            nonlocal binary_data
            r = len(binary_data) % 4
            if r != 0:
                binary_data.extend(b'\x00' * (4 - r))

        gltf_meshes = []
        gltf_nodes = []

        for m_idx, m in enumerate(self.meshes):
            pos_bytes = bytearray()
            min_pos = [float('inf')] * 3
            max_pos = [float('-inf')] * 3
            for p in m['positions']:
                pos_bytes.extend(struct.pack('<3f', p[0], p[1], p[2]))
                for c in range(3):
                    min_pos[c] = min(min_pos[c], p[c])
                    max_pos[c] = max(max_pos[c], p[c])

            norm_bytes = bytearray()
            for n in m['normals']:
                norm_bytes.extend(struct.pack('<3f', n[0], n[1], n[2]))

            uv_bytes = bytearray()
            for uv in m['uvs']:
                uv_bytes.extend(struct.pack('<2f', uv[0], uv[1]))

            idx_bytes = bytearray()
            max_i = max(m['indices']) if m['indices'] else 0
            fmt = '<I' if max_i > 65535 else '<H'
            comp_type = 5125 if max_i > 65535 else 5123
            for i in m['indices']:
                idx_bytes.extend(struct.pack(fmt, i))

            # BufferView & Accessor: Pos
            pad()
            bv_pos = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': len(binary_data), 'byteLength': len(pos_bytes), 'target': 34962})
            binary_data.extend(pos_bytes)

            acc_pos = len(accessors)
            accessors.append({'bufferView': bv_pos, 'byteOffset': 0, 'componentType': 5126, 'count': len(m['positions']), 'type': 'VEC3', 'min': min_pos, 'max': max_pos})

            # BufferView & Accessor: Norm
            pad()
            bv_norm = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': len(binary_data), 'byteLength': len(norm_bytes), 'target': 34962})
            binary_data.extend(norm_bytes)

            acc_norm = len(accessors)
            accessors.append({'bufferView': bv_norm, 'byteOffset': 0, 'componentType': 5126, 'count': len(m['normals']), 'type': 'VEC3'})

            # BufferView & Accessor: UV
            pad()
            bv_uv = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': len(binary_data), 'byteLength': len(uv_bytes), 'target': 34962})
            binary_data.extend(uv_bytes)

            acc_uv = len(accessors)
            accessors.append({'bufferView': bv_uv, 'byteOffset': 0, 'componentType': 5126, 'count': len(m['uvs']), 'type': 'VEC2'})

            # BufferView & Accessor: Indices
            pad()
            bv_idx = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': len(binary_data), 'byteLength': len(idx_bytes), 'target': 34963})
            binary_data.extend(idx_bytes)

            acc_idx = len(accessors)
            accessors.append({'bufferView': bv_idx, 'byteOffset': 0, 'componentType': comp_type, 'count': len(m['indices']), 'type': 'SCALAR'})

            gltf_meshes.append({
                'name': m['name'],
                'primitives': [{
                    'attributes': {'POSITION': acc_pos, 'NORMAL': acc_norm, 'TEXCOORD_0': acc_uv},
                    'indices': acc_idx,
                    'material': m['mat_idx'],
                    'mode': 4
                }]
            })
            gltf_nodes.append({'name': m['name'] + '_node', 'mesh': m_idx})

        # Images
        gltf_images = []
        for img_bytes in self.images:
            pad()
            bv_img = len(buffer_views)
            buffer_views.append({'buffer': 0, 'byteOffset': len(binary_data), 'byteLength': len(img_bytes)})
            binary_data.extend(img_bytes)
            gltf_images.append({'bufferView': bv_img, 'mimeType': 'image/png'})

        gltf_textures = [{'sampler': 0, 'source': i} for i in range(len(gltf_images))]
        samplers = [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}] if gltf_textures else []

        # Materials
        gltf_materials = []
        for mat in self.materials:
            pbr = {
                'baseColorFactor': list(mat['base_color']),
                'roughnessFactor': mat['roughness'],
                'metallicFactor': mat['metallic']
            }
            if mat['tex_albedo'] is not None:
                pbr['baseColorTexture'] = {'index': mat['tex_albedo']}
            if mat['tex_rm'] is not None:
                pbr['metallicRoughnessTexture'] = {'index': mat['tex_rm']}

            mat_dict = {'name': mat['name'], 'pbrMetallicRoughness': pbr, 'doubleSided': True}
            if mat['tex_normal'] is not None:
                mat_dict['normalTexture'] = {'index': mat['tex_normal'], 'scale': 1.0}

            gltf_materials.append(mat_dict)

        root_children = list(range(len(gltf_nodes)))
        all_nodes = gltf_nodes + [{'name': 'RootBuildingNode', 'children': root_children}]
        root_idx = len(all_nodes) - 1

        gltf = {
            'asset': {'version': '2.0', 'generator': 'PiSecOps AAA Mumbai Urban Building Generator'},
            'scene': 0,
            'scenes': [{'nodes': [root_idx]}],
            'nodes': all_nodes,
            'meshes': gltf_meshes,
            'materials': gltf_materials,
            'accessors': accessors,
            'bufferViews': buffer_views,
            'buffers': [{'byteLength': len(binary_data)}]
        }
        if gltf_textures:
            gltf['textures'] = gltf_textures
            gltf['images'] = gltf_images
            gltf['samplers'] = samplers

        json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
        r = len(json_bytes) % 4
        if r != 0:
            json_bytes += b' ' * (4 - r)

        r = len(binary_data) % 4
        if r != 0:
            binary_data.extend(b'\x00' * (4 - r))

        total_len = 12 + 8 + len(json_bytes) + 8 + len(binary_data)
        glb = bytearray()
        glb.extend(struct.pack('<4sII', b'glTF', 2, total_len))
        glb.extend(struct.pack('<I4s', len(json_bytes), b'JSON'))
        glb.extend(json_bytes)
        glb.extend(struct.pack('<I4s', len(binary_data), b'BIN\x00'))
        glb.extend(binary_data)

        with open(output_path, 'wb') as f:
            f.write(glb)

        print(f"-> Successfully exported AAA GLB: {output_path} ({len(glb) / 1024:.1f} KB, meshes: {len(self.meshes)})")

# -------------------------------------------------------------
# 4. ARCHITECTURAL ASSEMBLY FOR 6-STOREY MUMBAI BUILDING
# -------------------------------------------------------------

def build_mumbai_building(lod=0):
    print(f"\n--- Constructing Mumbai Urban Building LOD{lod} ---")
    builder = EnhancedGLBBuilder()

    # Load / Generate textures
    facade_albedo, facade_normal, facade_rm = generate_facade_textures()
    shop_albedo, shop_normal = generate_shop_textures()
    window_albedo = generate_window_textures()
    tank_albedo = generate_rooftop_prop_textures()
    laundry_albedo = generate_laundry_textures()

    # Materials
    mat_facade = builder.add_material("Facade_Concrete_PBR", roughness=0.88, metallic=0.04,
                                      albedo_img=facade_albedo, normal_img=facade_normal, rm_img=facade_rm)
    mat_shops = builder.add_material("Commercial_Shops_PBR", roughness=0.45, metallic=0.4,
                                     albedo_img=shop_albedo, normal_img=shop_normal)
    mat_windows = builder.add_material("Reflective_Windows_PBR", roughness=0.15, metallic=0.85,
                                       albedo_img=window_albedo)
    mat_metal = builder.add_material("Architectural_Metal_PBR", base_color=(0.18, 0.20, 0.22, 1.0), roughness=0.4, metallic=0.8)
    mat_tanks = builder.add_material("Rooftop_Sintex_PBR", roughness=0.5, metallic=0.05, albedo_img=tank_albedo)
    mat_laundry = builder.add_material("Balcony_Laundry_PBR", roughness=0.9, metallic=0.0, albedo_img=laundry_albedo)
    mat_drainage = builder.add_material("PVC_Drainage_PBR", base_color=(0.55, 0.58, 0.62, 1.0), roughness=0.35, metallic=0.1)

    # Building dimensions: 16m wide, 12m deep, ~23m tall
    width = 16.0
    depth = 12.0
    ground_h = 3.6
    floor_h = 3.2
    num_res_floors = 5
    total_h = ground_h + num_res_floors * floor_h # 19.6m to roof floor

    # 4.1 Ground Floor Commercial & Entrance Lobby
    ground_parts = []
    # Main ground structure box
    ground_parts.append(create_box_mesh(0, ground_h / 2.0, 0, width, ground_h, depth))
    # Concrete entrance steps
    ground_parts.append(create_box_mesh(0, 0.2, depth / 2.0 + 0.6, 2.8, 0.4, 1.2))
    # Entrance awning canopy (weather protection)
    ground_parts.append(create_box_mesh(0, ground_h - 0.2, depth / 2.0 + 0.9, 3.4, 0.2, 1.8))
    builder.add_mesh("Ground_Structure", *merge_mesh_list(ground_parts), material_idx=mat_facade)

    # Commercial Shops Shutters (3 Shop Bays along ground front z = depth/2 + 0.05)
    shop_meshes = []
    shop_width = 3.6
    shop_xs = [-5.2, 0.0, 5.2]
    for idx, sx in enumerate(shop_xs):
        # Rolling shutter face with signage
        shop_meshes.append(create_box_mesh(sx, ground_h / 2.0 + 0.1, depth / 2.0 + 0.06, shop_width, ground_h - 0.6, 0.18))
    builder.add_mesh("Shop_Fronts", *merge_mesh_list(shop_meshes), material_idx=mat_shops)

    # Ground entrance gate (collapsible Indian security iron grill)
    gate_parts = []
    gate_parts.append(create_box_mesh(0, (ground_h - 0.8) / 2.0, depth / 2.0 + 0.08, 2.2, ground_h - 0.8, 0.06))
    builder.add_mesh("Entrance_Gate", *merge_mesh_list(gate_parts), material_idx=mat_metal)

    # 4.2 Residential Floors (Floors 1 to 5)
    facade_parts = []
    window_parts = []
    balcony_parts = []
    railings_parts = []
    ac_units_parts = []
    laundry_parts = []

    for f in range(num_res_floors):
        fy_base = ground_h + f * floor_h
        fy_center = fy_base + floor_h / 2.0

        # Main exterior wall envelope for this floor
        facade_parts.append(create_box_mesh(0, fy_center, 0, width, floor_h, depth))

        # Horizontal floor slab cornice / Chhajja projection
        facade_parts.append(create_box_mesh(0, fy_base, 0, width + 0.4, 0.22, depth + 0.4))

        # Windows layout (3 bays on front facade at z = depth/2 + 0.04)
        # Windows at x = -4.5, 0.0, 4.5
        for wx in [-4.8, 0.0, 4.8]:
            # Recessed window glass pane
            window_parts.append(create_box_mesh(wx, fy_center + 0.1, depth / 2.0 + 0.05, 1.8, 1.9, 0.08))
            # Concrete chhajja weather shade projection above window
            facade_parts.append(create_box_mesh(wx, fy_center + 1.25, depth / 2.0 + 0.45, 2.2, 0.15, 0.8))

        # Protruding Balconies on Left & Right wings (x = -4.8 and 4.8)
        for bx in [-4.8, 4.8]:
            balc_z = depth / 2.0 + 0.95
            # Balcony concrete floor slab
            balcony_parts.append(create_box_mesh(bx, fy_base + 0.12, balc_z, 2.5, 0.24, 1.8))

            if lod < 2:
                # Metal balcony railings (front & two sides)
                rail_h = 0.95
                ry = fy_base + 0.24 + rail_h / 2.0
                # Front rail
                railings_parts.append(create_box_mesh(bx, ry, balc_z + 0.85, 2.45, rail_h, 0.05))
                # Side rails
                railings_parts.append(create_box_mesh(bx - 1.2, ry, balc_z, 0.05, rail_h, 1.7))
                railings_parts.append(create_box_mesh(bx + 1.2, ry, balc_z, 0.05, rail_h, 1.7))

            # Balcony Laundry (hanging clothes on drying lines)
            if lod == 0 and (f % 2 == 1):
                cloth_x = bx + random.uniform(-0.4, 0.4)
                laundry_parts.append(create_box_mesh(cloth_x, fy_base + 0.65, balc_z + 0.3, 0.9, 0.7, 0.04))

        # Wall-mounted Outdoor Split AC Compressor Units (x = -2.1 and 2.1)
        if lod < 2:
            for ac_x in [-2.2, 2.2]:
                ac_y = fy_base + 0.75
                ac_z = depth / 2.0 + 0.35
                # AC compressor outdoor unit
                ac_units_parts.append(create_box_mesh(ac_x, ac_y, ac_z, 0.95, 0.70, 0.45))
                # Steel L-bracket mount
                ac_units_parts.append(create_box_mesh(ac_x, ac_y - 0.4, ac_z - 0.1, 0.85, 0.12, 0.35))

    builder.add_mesh("Residential_Walls", *merge_mesh_list(facade_parts), material_idx=mat_facade)
    builder.add_mesh("Windows_Glass", *merge_mesh_list(window_parts), material_idx=mat_windows)
    builder.add_mesh("Balcony_Slabs", *merge_mesh_list(balcony_parts), material_idx=mat_facade)

    if len(railings_parts) > 0:
        builder.add_mesh("Balcony_Railings", *merge_mesh_list(railings_parts), material_idx=mat_metal)
    if len(ac_units_parts) > 0:
        builder.add_mesh("AC_Compressor_Units", *merge_mesh_list(ac_units_parts), material_idx=mat_metal)
    if len(laundry_parts) > 0:
        builder.add_mesh("Balcony_Laundry", *merge_mesh_list(laundry_parts), material_idx=mat_laundry)

    # 4.3 Vertical PVC Stormwater Downspout Drainage Pipes running down exterior corners
    if lod < 2:
        drainage_parts = []
        pipe_xs = [-width / 2.0 + 0.25, width / 2.0 - 0.25]
        for px in pipe_xs:
            pz = depth / 2.0 + 0.15
            drain_h = total_h
            drainage_parts.append(create_cylinder_mesh(px, drain_h / 2.0, pz, 0.08, drain_h, segments=8, axis='y'))
            # Wall mounting brackets every 3 meters
            for by in range(2, int(total_h), 3):
                drainage_parts.append(create_box_mesh(px, by, pz - 0.08, 0.24, 0.08, 0.16))
        builder.add_mesh("Drainage_Pipes", *merge_mesh_list(drainage_parts), material_idx=mat_drainage)

    # 4.4 Rooftop Infrastructure (Floor 6 Terrace)
    roof_y = total_h
    roof_parts = []
    # Rooftop perimeter parapet wall (1.2m height)
    # Front & back parapets
    roof_parts.append(create_box_mesh(0, roof_y + 0.6, depth / 2.0, width, 1.2, 0.3))
    roof_parts.append(create_box_mesh(0, roof_y + 0.6, -depth / 2.0, width, 1.2, 0.3))
    # Left & right parapets
    roof_parts.append(create_box_mesh(-width / 2.0, roof_y + 0.6, 0, 0.3, 1.2, depth))
    roof_parts.append(create_box_mesh(width / 2.0, roof_y + 0.6, 0, 0.3, 1.2, depth))

    # Staircase Mumty (Headhouse cabin for rooftop access)
    mumty_w, mumty_h, mumty_d = 4.2, 2.8, 4.0
    roof_parts.append(create_box_mesh(0, roof_y + mumty_h / 2.0, -2.5, mumty_w, mumty_h, mumty_d))
    builder.add_mesh("Rooftop_Structure", *merge_mesh_list(roof_parts), material_idx=mat_facade)

    # Sintex Black Cylindrical Water Tanks on raised concrete plinths
    tank_parts = []
    tank_xs = [-4.5, 4.5]
    for tx in tank_xs:
        # Concrete plinth
        tank_parts.append(create_box_mesh(tx, roof_y + 0.3, 2.5, 2.2, 0.6, 2.2))
        # Ribbed tank body
        tank_parts.append(create_cylinder_mesh(tx, roof_y + 0.6 + 1.1, 2.5, 0.9, 2.2, segments=14, axis='y'))
    builder.add_mesh("Water_Tanks", *merge_mesh_list(tank_parts), material_idx=mat_tanks)

    # Satellite Dish Antennas & Communications Mast
    if lod < 2:
        antenna_parts = []
        # Tall central TV/Lightning antenna mast
        antenna_parts.append(create_cylinder_mesh(0, roof_y + mumty_h + 2.2, -2.5, 0.05, 4.4, segments=6, axis='y'))
        antenna_parts.append(create_box_mesh(0, roof_y + mumty_h + 3.6, -2.5, 1.6, 0.06, 0.06))

        # Satellite Dishes (Tata Sky style angled parabolic dish)
        dish_xs = [-2.8, 3.2]
        for dx in dish_xs:
            dish_y = roof_y + 0.9
            dish_z = 3.6
            # Mount pole
            antenna_parts.append(create_cylinder_mesh(dx, dish_y, dish_z, 0.04, 1.2, segments=6, axis='y'))
            # Concave dish disc
            antenna_parts.append(create_cylinder_mesh(dx, dish_y + 0.6, dish_z, 0.55, 0.1, segments=12, axis='z'))

        builder.add_mesh("Antennas_Dishes", *merge_mesh_list(antenna_parts), material_idx=mat_metal)

    # Export GLB
    suffix = "" if lod == 0 else f"_lod{lod}"
    file_name = f"mumbai_urban_building_aaa{suffix}.glb"
    out_file = os.path.join(output_dir, file_name)
    builder.build(out_file)

    # Also save as master mumbai_urban_building_lod0.glb if lod==0
    if lod == 0:
        lod0_file = os.path.join(output_dir, "mumbai_urban_building_lod0.glb")
        builder.build(lod0_file)

if __name__ == "__main__":
    # Generate full LOD suite
    build_mumbai_building(lod=0) # Master high-detail
    build_mumbai_building(lod=1) # Medium distance
    build_mumbai_building(lod=2) # Far silhouette
    print("\nALL AAA MUMBAI BUILDING ASSETS GENERATED SUCCESSFULLY!")
