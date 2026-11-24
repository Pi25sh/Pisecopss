import os
import re

def inspect_file(name, path):
    print("=" * 50)
    print("Inspecting:", name)
    print("Path:", path, "Size:", os.path.getsize(path))
    with open(path, "rb") as f:
        data = f.read()

    # Search for bone names or node names
    nodes = re.findall(rb"Model::([a-zA-Z0-9_:\-]+)", data)
    decoded_nodes = [n.decode('latin1', errors='ignore') for n in nodes]
    sample_bones = [n for n in decoded_nodes if any(k in n.lower() for k in ['hip', 'spine', 'arm', 'leg', 'head', 'hand', 'foot'])]
    print("Found bones count:", len(sample_bones))
    print("Sample bones (first 10):", sample_bones[:10])

    # Search for animation curves / tracks
    anim_nodes = re.findall(rb"AnimationCurveNode::([a-zA-Z0-9_:\-]+)", data)
    print("Animation curve nodes count:", len(anim_nodes))
    if anim_nodes:
        print("Sample anim nodes:", [n.decode('latin1', errors='ignore') for n in anim_nodes[:10]])

inspect_file("Ch42", r"d:\bombaii thefts\Ch42_nonPBR.fbx")
inspect_file("Walking", r"d:\bombaii thefts\Walking.fbx")
inspect_file("Running", r"d:\bombaii thefts\Running.fbx")
