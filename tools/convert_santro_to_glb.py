import os
import struct
import json
import numpy as np
from PIL import Image, ImageDraw

def create_taxi_roof_sign_texture():
    """Generates an illuminated yellow taxi roof sign texture with 'TAXI' and 'MH 01'."""
    img = Image.new('RGB', (256, 128), (255, 210, 20))
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, 252, 124], outline=(180, 140, 10), width=3)
    d.text((55, 35), "TAXI", fill=(10, 10, 15))
    d.text((65, 85), "MH-01", fill=(30, 30, 35))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()

import io

def convert_santro():
    obj_path = r"D:\bombaii thefts\santro.obj"
    out_glb_path = r"D:\bombaii thefts\PiSecOps-Mumbai-Open-World\public\assets\vehicles\mumbai_santro_taxi.glb"

    print("Reading santro.obj...")
    vertices = []
    faces = []
    
    with open(obj_path, 'r', errors='ignore') as f:
        for line in f:
            if line.startswith('v '):
                p = line.split()
                vertices.append([float(p[1]), float(p[2]), float(p[3])])
            elif line.startswith('f '):
                p = line.split()[1:]
                # Triangle or quad fan
                face_indices = [int(x.split('/')[0]) - 1 for x in p]
                for i in range(1, len(face_indices) - 1):
                    faces.append([face_indices[0], face_indices[i], face_indices[i+1]])

    varr = np.array(vertices, dtype=np.float32)
    farr = np.array(faces, dtype=np.uint32)

    print(f"Loaded {len(varr)} vertices, {len(farr)} triangles.")

    # Target Santro dimensions: length ~ 3.56m, width ~ 1.55m, height ~ 1.58m
    # In original: X is length (15.5m), Y is height (6.92m), Z is width (7.4m)
    scale = 3.56 / (varr[:, 0].max() - varr[:, 0].min())
    varr *= scale

    # Center in X and Z
    varr[:, 0] -= (varr[:, 0].max() + varr[:, 0].min()) / 2.0
    varr[:, 2] -= (varr[:, 2].max() + varr[:, 2].min()) / 2.0
    # Put bottom of tires at Y = 0
    varr[:, 1] -= varr[:, 1].min()

    # Rotate 90 degrees around Y so length is along Z (forward = -Z, car facing forward)
    # New X = -Z, New Z = X
    orig_x = varr[:, 0].copy()
    orig_z = varr[:, 2].copy()
    varr[:, 0] = orig_z
    varr[:, 2] = -orig_x

    # Calculate smooth vertex normals
    normals = np.zeros_like(varr)
    v0 = varr[farr[:, 0]]
    v1 = varr[farr[:, 1]]
    v2 = varr[farr[:, 2]]
    face_normals = np.cross(v1 - v0, v2 - v0)
    # Normalize face normals
    fn_lens = np.linalg.norm(face_normals, axis=1, keepdims=True)
    fn_lens[fn_lens == 0] = 1.0
    face_normals /= fn_lens

    for i in range(3):
        np.add.at(normals, farr[:, i], face_normals)
    n_lens = np.linalg.norm(normals, axis=1, keepdims=True)
    n_lens[n_lens == 0] = 1.0
    normals /= n_lens

    # Categorize faces into Kaali (Black lower body) and Peeli (Yellow roof)
    # Roof threshold: top 40% of car height
    max_y = varr[:, 1].max()
    min_y = varr[:, 1].min()
    roof_cutoff = min_y + 0.58 * (max_y - min_y)

    face_centers_y = (varr[farr[:, 0], 1] + varr[farr[:, 1], 1] + varr[farr[:, 2], 1]) / 3.0
    
    yellow_mask = face_centers_y >= roof_cutoff
    black_mask = ~yellow_mask

    farr_yellow = farr[yellow_mask]
    farr_black = farr[black_mask]

    print(f"Yellow roof faces: {len(farr_yellow)}, Black body faces: {len(farr_black)}")

    # Add 3D Taxi Roof Box on top of the car roof
    # Box dimensions: width 0.45m, height 0.14m, length 0.22m, placed at roof center
    roof_z = 0.1  # slightly towards front of roof
    roof_y = max_y + 0.07
    rw, rh, rl = 0.22, 0.08, 0.12
    box_v = np.array([
        [-rw, roof_y - rh, roof_z - rl], [rw, roof_y - rh, roof_z - rl],
        [rw, roof_y + rh, roof_z - rl], [-rw, roof_y + rh, roof_z - rl],
        [-rw, roof_y - rh, roof_z + rl], [rw, roof_y - rh, roof_z + rl],
        [rw, roof_y + rh, roof_z + rl], [-rw, roof_y + rh, roof_z + rl],
    ], dtype=np.float32)
    box_n = np.array([[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]], dtype=np.float32)
    box_f = np.array([
        [0,2,1], [0,3,2], # back
        [4,5,6], [4,6,7], # front
        [0,1,5], [0,5,4], # bottom
        [2,3,7], [2,7,6], # top
        [0,4,7], [0,7,3], # left
        [1,2,6], [1,6,5], # right
    ], dtype=np.uint32) + len(varr)

    all_v = np.vstack([varr, box_v])
    all_n = np.vstack([normals, box_n])

    # Add taxi box to yellow faces
    farr_yellow = np.vstack([farr_yellow, box_f])

    # Convert to unified vertex buffer and index buffers
    v_bytes = all_v.astype(np.float32).tobytes()
    n_bytes = all_n.astype(np.float32).tobytes()
    idx_black_bytes = farr_black.astype(np.uint32).tobytes()
    idx_yellow_bytes = farr_yellow.astype(np.uint32).tobytes()

    # Align byte offsets to 4 bytes
    def pad4(b):
        pad = (4 - (len(b) % 4)) % 4
        return b + b'\x00' * pad

    v_bytes_p = pad4(v_bytes)
    n_bytes_p = pad4(n_bytes)
    idx_black_p = pad4(idx_black_bytes)
    idx_yellow_p = pad4(idx_yellow_bytes)

    offset_v = 0
    len_v = len(v_bytes)
    offset_n = len(v_bytes_p)
    len_n = len(n_bytes)
    offset_idx_black = offset_n + len(n_bytes_p)
    len_idx_black = len(idx_black_bytes)
    offset_idx_yellow = offset_idx_black + len(idx_black_p)
    len_idx_yellow = len(idx_yellow_bytes)

    bin_data = v_bytes_p + n_bytes_p + idx_black_p + idx_yellow_p

    gltf = {
        "asset": {"version": "2.0", "generator": "PiSecOps Santro Taxi Generator"},
        "scenes": [{"nodes": [0]}],
        "nodes": [
            {
                "name": "Santro_Kaali_Peeli_Taxi",
                "mesh": 0
            }
        ],
        "materials": [
            {
                "name": "Kaali_Black_Metal",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.03, 0.03, 0.035, 1.0],
                    "metallicFactor": 0.82,
                    "roughnessFactor": 0.25
                }
            },
            {
                "name": "Peeli_Yellow_Roof",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.98, 0.78, 0.08, 1.0],
                    "metallicFactor": 0.65,
                    "roughnessFactor": 0.3
                },
                "emissiveFactor": [0.08, 0.06, 0.01]
            }
        ],
        "meshes": [
            {
                "name": "Santro_Mesh",
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "NORMAL": 1},
                        "indices": 2,
                        "material": 0
                    },
                    {
                        "attributes": {"POSITION": 0, "NORMAL": 1},
                        "indices": 3,
                        "material": 1
                    }
                ]
            }
        ],
        "accessors": [
            {
                "bufferView": 0,
                "byteOffset": 0,
                "componentType": 5126, # FLOAT
                "count": len(all_v),
                "type": "VEC3",
                "min": all_v.min(axis=0).tolist(),
                "max": all_v.max(axis=0).tolist()
            },
            {
                "bufferView": 1,
                "byteOffset": 0,
                "componentType": 5126,
                "count": len(all_n),
                "type": "VEC3",
                "min": all_n.min(axis=0).tolist(),
                "max": all_n.max(axis=0).tolist()
            },
            {
                "bufferView": 2,
                "byteOffset": 0,
                "componentType": 5125, # UNSIGNED_INT
                "count": len(farr_black) * 3,
                "type": "SCALAR",
                "min": [int(farr_black.min())],
                "max": [int(farr_black.max())]
            },
            {
                "bufferView": 3,
                "byteOffset": 0,
                "componentType": 5125,
                "count": len(farr_yellow) * 3,
                "type": "SCALAR",
                "min": [int(farr_yellow.min())],
                "max": [int(farr_yellow.max())]
            }
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": offset_v, "byteLength": len_v, "target": 34962},
            {"buffer": 0, "byteOffset": offset_n, "byteLength": len_n, "target": 34962},
            {"buffer": 0, "byteOffset": offset_idx_black, "byteLength": len_idx_black, "target": 34963},
            {"buffer": 0, "byteOffset": offset_idx_yellow, "byteLength": len_idx_yellow, "target": 34963}
        ],
        "buffers": [
            {"byteLength": len(bin_data)}
        ]
    }

    json_str = json.dumps(gltf).encode('utf-8')
    json_pad = (4 - (len(json_str) % 4)) % 4
    json_bytes = json_str + b' ' * json_pad

    # GLB Header: magic (4), version (4), length (4)
    # Chunk 0: json_len (4), 0x4E4F534A (JSON), json_bytes
    # Chunk 1: bin_len (4), 0x004E4942 (BIN), bin_data
    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_data)

    with open(out_glb_path, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total_len))
        f.write(struct.pack('<II', len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack('<II', len(bin_data), 0x004E4942))
        f.write(bin_data)

    print(f"Successfully generated {out_glb_path} (size: {os.path.getsize(out_glb_path)} bytes)")

if __name__ == '__main__':
    convert_santro()
