import re

def inspect_obj(filepath):
    vertices = []
    objects = []
    current_obj = "default"
    faces = 0
    with open(filepath, 'r', errors='ignore') as f:
        for line in f:
            if line.startswith('o ') or line.startswith('g '):
                current_obj = line.split()[1]
                objects.append(current_obj)
            elif line.startswith('v '):
                parts = line.split()
                vertices.append([float(parts[1]), float(parts[2]), float(parts[3])])
            elif line.startswith('f '):
                faces += 1
    
    import numpy as np
    varr = np.array(vertices)
    print(f"Total vertices: {len(vertices)}, Total faces: {faces}")
    print(f"Objects ({len(objects)}): {objects[:15]}")
    print(f"Min (X,Y,Z): {varr.min(axis=0)}")
    print(f"Max (X,Y,Z): {varr.max(axis=0)}")
    print(f"Size (X,Y,Z): {varr.max(axis=0) - varr.min(axis=0)}")

inspect_obj(r"D:\bombaii thefts\santro.obj")
