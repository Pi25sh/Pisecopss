import os
import math
import random
from PIL import Image, ImageDraw
import sys

sys.path.insert(0, r"d:\bombaii thefts\playcanvas_game\tools")
from glb_builder import GLBBuilder
from geometry_helpers import create_box, create_cylinder, merge_meshes

base_assets = r"d:\bombaii thefts\PiSecOps-Mumbai-Open-World\public\assets"

def generate_coastal_palms():
    builder = GLBBuilder()
    trunk_parts = []
    segments = 10
    height_per_seg = 0.8
    curr_x, curr_z = 0.0, 0.0
    for s in range(segments):
        radius = 0.40 - s * 0.015
        cy = s * height_per_seg + height_per_seg * 0.5
        cx = math.sin(s * 0.28) * 0.6
        cz = 0.0
        trunk_parts.append(create_cylinder(cx, cy, cz, radius, height_per_seg, segments=12, axis='y'))
    
    trunk_mesh = merge_meshes(*trunk_parts)
    
    frond_parts = []
    top_y = segments * height_per_seg
    top_x = math.sin((segments - 1) * 0.28) * 0.6
    num_fronds = 10
    for f in range(num_fronds):
        angle = f * (2.0 * math.pi / num_fronds)
        ca, sa = math.cos(angle), math.sin(angle)
        # 3 segments per frond curving downward
        for seg in range(3):
            dist = 0.8 + seg * 0.9
            fx = top_x + ca * dist
            fz = sa * dist
            fy = top_y - (seg * 0.35)
            frond_parts.append(create_box(fx, fy, fz, 0.35, 0.06, 0.9))
            
    leaves_mesh = merge_meshes(*frond_parts)

    bark_img = Image.new('RGB', (256, 256), (115, 82, 54))
    draw = ImageDraw.Draw(bark_img)
    for y in range(0, 256, 16):
        draw.line([(0, y), (256, y)], fill=(80, 52, 30), width=4)
    mat_trunk = builder.add_material("PalmTrunk", roughness=0.9, metallic=0.0, texture_image=bark_img)
    builder.add_mesh("TrunkMesh", trunk_mesh[0], trunk_mesh[1], trunk_mesh[2], trunk_mesh[3], mat_trunk)

    leaf_img = Image.new('RGB', (256, 256), (42, 135, 38))
    ldraw = ImageDraw.Draw(leaf_img)
    for y in range(0, 256, 8):
        ldraw.line([(0, y), (256, y)], fill=(28, 95, 25), width=2)
    mat_leaf = builder.add_material("PalmLeaves", roughness=0.6, metallic=0.0, texture_image=leaf_img)
    builder.add_mesh("LeavesMesh", leaves_mesh[0], leaves_mesh[1], leaves_mesh[2], leaves_mesh[3], mat_leaf)

    out_path = os.path.join(base_assets, "props", "coastal_palms_vegetation.glb")
    builder.build(out_path)
    print("Exported:", out_path)

def generate_tetrapods():
    builder = GLBBuilder()
    parts = []
    # 4 interlocking legs radiating from center
    # Leg 1 pointing up
    parts.append(create_cylinder(0, 0.8, 0, 0.45, 1.4, segments=10, axis='y'))
    # Leg 2 pointing right-down
    parts.append(create_cylinder(0.7, 0.4, 0, 0.45, 1.4, segments=10, axis='x'))
    # Leg 3 pointing left-back
    parts.append(create_cylinder(-0.35, 0.3, 0.65, 0.45, 1.4, segments=10, axis='z'))
    # Leg 4 pointing left-front
    parts.append(create_cylinder(-0.35, 0.3, -0.65, 0.45, 1.4, segments=10, axis='z'))
    
    tetrapod_mesh = merge_meshes(*parts)
    
    concrete_img = Image.new('RGB', (256, 256), (150, 153, 155))
    draw = ImageDraw.Draw(concrete_img)
    for _ in range(500):
        rx, ry = random.randint(0, 255), random.randint(0, 255)
        c = random.randint(120, 180)
        draw.point((rx, ry), fill=(c, c, c))
    mat_tetrapod = builder.add_material("MarineConcrete", roughness=0.9, metallic=0.0, texture_image=concrete_img)
    builder.add_mesh("TetrapodMesh", tetrapod_mesh[0], tetrapod_mesh[1], tetrapod_mesh[2], tetrapod_mesh[3], mat_tetrapod)

    out_path = os.path.join(base_assets, "props", "tetrapod_seawall.glb")
    builder.build(out_path)
    print("Exported:", out_path)

def generate_rooftop_infrastructure():
    builder = GLBBuilder()
    # 1. Sintex black water tank
    tank_mesh = create_cylinder(-2.0, 1.0, 0.0, 0.85, 2.0, segments=16, axis='y')
    tank_img = Image.new('RGB', (256, 256), (30, 30, 32))
    tdraw = ImageDraw.Draw(tank_img)
    tdraw.text((60, 110), "SINTEX", fill=(240, 240, 240))
    mat_tank = builder.add_material("WaterTank", roughness=0.5, metallic=0.0, texture_image=tank_img)
    builder.add_mesh("TankMesh", tank_mesh[0], tank_mesh[1], tank_mesh[2], tank_mesh[3], mat_tank)

    # 2. AC outdoor compressor unit
    ac_mesh = create_box(1.5, 0.45, 0.0, 1.2, 0.9, 0.5)
    ac_img = Image.new('RGB', (256, 256), (210, 212, 215))
    adraw = ImageDraw.Draw(ac_img)
    adraw.rectangle([30, 30, 150, 150], fill=(50, 52, 55))
    mat_ac = builder.add_material("ACUnit", roughness=0.4, metallic=0.3, texture_image=ac_img)
    builder.add_mesh("ACMesh", ac_mesh[0], ac_mesh[1], ac_mesh[2], ac_mesh[3], mat_ac)

    # 3. Satellite dish antenna
    dish_parts = [
        create_cylinder(0.0, 1.2, -1.5, 0.65, 0.12, segments=14, axis='z'),
        create_cylinder(0.0, 0.5, -1.5, 0.05, 1.0, segments=8, axis='y')
    ]
    dish_mesh = merge_meshes(*dish_parts)
    dish_img = Image.new('RGB', (256, 256), (220, 222, 224))
    mat_dish = builder.add_material("SatelliteDish", roughness=0.3, metallic=0.5, texture_image=dish_img)
    builder.add_mesh("DishMesh", dish_mesh[0], dish_mesh[1], dish_mesh[2], dish_mesh[3], mat_dish)

    out_path = os.path.join(base_assets, "props", "rooftop_infrastructure.glb")
    builder.build(out_path)
    print("Exported:", out_path)

def generate_civilian_npc():
    builder = GLBBuilder()
    head_mesh = create_cylinder(0.0, 1.65, 0.0, 0.14, 0.28, segments=10, axis='y')
    hair_mesh = create_cylinder(0.0, 1.77, 0.0, 0.15, 0.10, segments=10, axis='y')
    
    torso = create_box(0.0, 1.25, 0.0, 0.48, 0.62, 0.28)
    larm = create_cylinder(-0.32, 1.25, 0.0, 0.07, 0.58, segments=8, axis='y')
    rarm = create_cylinder(0.32, 1.25, 0.0, 0.07, 0.58, segments=8, axis='y')
    upper_body = merge_meshes(torso, larm, rarm)

    lleg = create_cylinder(-0.13, 0.48, 0.0, 0.08, 0.85, segments=8, axis='y')
    rleg = create_cylinder(0.13, 0.48, 0.0, 0.08, 0.85, segments=8, axis='y')
    pants = merge_meshes(lleg, rleg)

    lshoe = create_box(-0.13, 0.04, 0.04, 0.13, 0.08, 0.24)
    rshoe = create_box(0.13, 0.04, 0.04, 0.13, 0.08, 0.24)
    shoes = merge_meshes(lshoe, rshoe)

    skin_img = Image.new('RGB', (128, 128), (210, 165, 130))
    mat_skin = builder.add_material("Skin", roughness=0.8, metallic=0.0, texture_image=skin_img)
    builder.add_mesh("Head", head_mesh[0], head_mesh[1], head_mesh[2], head_mesh[3], mat_skin)

    hair_img = Image.new('RGB', (64, 64), (25, 20, 20))
    mat_hair = builder.add_material("Hair", roughness=0.9, metallic=0.0, texture_image=hair_img)
    builder.add_mesh("Hair", hair_mesh[0], hair_mesh[1], hair_mesh[2], hair_mesh[3], mat_hair)

    shirt_img = Image.new('RGB', (256, 256), (45, 95, 140))
    sdraw = ImageDraw.Draw(shirt_img)
    sdraw.line([(128, 0), (128, 256)], fill=(30, 70, 110), width=6)
    for by in range(40, 240, 40):
        sdraw.ellipse([(124, by), (132, by+8)], fill=(240, 240, 240))
    mat_shirt = builder.add_material("Shirt", roughness=0.7, metallic=0.0, texture_image=shirt_img)
    builder.add_mesh("UpperBody", upper_body[0], upper_body[1], upper_body[2], upper_body[3], mat_shirt)

    pants_img = Image.new('RGB', (128, 128), (55, 60, 65))
    mat_pants = builder.add_material("Pants", roughness=0.7, metallic=0.0, texture_image=pants_img)
    builder.add_mesh("Pants", pants[0], pants[1], pants[2], pants[3], mat_pants)

    shoes_img = Image.new('RGB', (64, 64), (35, 25, 20))
    mat_shoes = builder.add_material("Shoes", roughness=0.4, metallic=0.0, texture_image=shoes_img)
    builder.add_mesh("Shoes", shoes[0], shoes[1], shoes[2], shoes[3], mat_shoes)

    out_path = os.path.join(base_assets, "characters", "civilian_npc_realistic.glb")
    builder.build(out_path)
    print("Exported:", out_path)

def generate_traffic_cop():
    builder = GLBBuilder()
    head = create_cylinder(0.0, 1.65, 0.0, 0.14, 0.28, segments=10, axis='y')
    cap = create_cylinder(0.0, 1.82, 0.0, 0.18, 0.10, segments=12, axis='y')
    visor = create_box(0.0, 1.78, 0.16, 0.22, 0.03, 0.14)
    cap_mesh = merge_meshes(cap, visor)

    torso = create_box(0.0, 1.25, 0.0, 0.50, 0.64, 0.30)
    larm = create_cylinder(-0.33, 1.25, 0.0, 0.08, 0.58, segments=8, axis='y')
    rarm = create_cylinder(0.33, 1.25, 0.0, 0.08, 0.58, segments=8, axis='y')
    vest_mesh = merge_meshes(torso, larm, rarm)

    lleg = create_cylinder(-0.13, 0.48, 0.0, 0.09, 0.85, segments=8, axis='y')
    rleg = create_cylinder(0.13, 0.48, 0.0, 0.09, 0.85, segments=8, axis='y')
    legs = merge_meshes(lleg, rleg)

    lshoe = create_box(-0.13, 0.04, 0.04, 0.14, 0.08, 0.24)
    rshoe = create_box(0.13, 0.04, 0.04, 0.14, 0.08, 0.24)
    boots = merge_meshes(lshoe, rshoe)

    skin_img = Image.new('RGB', (128, 128), (205, 155, 120))
    mat_skin = builder.add_material("CopSkin", roughness=0.8, metallic=0.0, texture_image=skin_img)
    builder.add_mesh("CopHead", head[0], head[1], head[2], head[3], mat_skin)

    cap_img = Image.new('RGB', (128, 128), (245, 245, 248))
    cdraw = ImageDraw.Draw(cap_img)
    cdraw.rectangle([0, 100, 128, 128], fill=(20, 20, 30))
    cdraw.ellipse([54, 70, 74, 90], fill=(212, 175, 55))
    mat_cap = builder.add_material("PoliceCap", roughness=0.4, metallic=0.1, texture_image=cap_img)
    builder.add_mesh("CapMesh", cap_mesh[0], cap_mesh[1], cap_mesh[2], cap_mesh[3], mat_cap)

    vest_img = Image.new('RGB', (256, 256), (225, 245, 45))
    vdraw = ImageDraw.Draw(vest_img)
    vdraw.rectangle([0, 80, 256, 115], fill=(215, 225, 230))
    vdraw.rectangle([0, 170, 256, 205], fill=(215, 225, 230))
    vdraw.text((40, 130), "MUMBAI POLICE", fill=(10, 15, 40))
    mat_vest = builder.add_material("HighVisVest", roughness=0.5, metallic=0.2, texture_image=vest_img)
    builder.add_mesh("CopVest", vest_mesh[0], vest_mesh[1], vest_mesh[2], vest_mesh[3], mat_vest)

    pants_img = Image.new('RGB', (128, 128), (220, 240, 40))
    pdraw = ImageDraw.Draw(pants_img)
    pdraw.rectangle([0, 60, 128, 80], fill=(215, 225, 230))
    mat_cop_pants = builder.add_material("CopPants", roughness=0.6, metallic=0.1, texture_image=pants_img)
    builder.add_mesh("CopPantsMesh", legs[0], legs[1], legs[2], legs[3], mat_cop_pants)

    boots_img = Image.new('RGB', (64, 64), (15, 15, 18))
    mat_boots = builder.add_material("Boots", roughness=0.3, metallic=0.1, texture_image=boots_img)
    builder.add_mesh("CopBoots", boots[0], boots[1], boots[2], boots[3], mat_boots)

    out_path = os.path.join(base_assets, "characters", "traffic_cop_realistic.glb")
    builder.build(out_path)
    print("Exported:", out_path)

def generate_street_vendor():
    builder = GLBBuilder()
    head = create_cylinder(0.0, 1.65, 0.0, 0.14, 0.28, segments=10, axis='y')
    cap = create_box(0.0, 1.80, 0.0, 0.30, 0.12, 0.32)
    torso = create_box(0.0, 1.25, 0.0, 0.50, 0.66, 0.28)
    gamcha = create_box(-0.16, 1.25, 0.0, 0.20, 0.74, 0.34)
    larm = create_cylinder(-0.33, 1.25, 0.0, 0.08, 0.58, segments=8, axis='y')
    rarm = create_cylinder(0.33, 1.25, 0.0, 0.08, 0.58, segments=8, axis='y')
    upper_body = merge_meshes(torso, larm, rarm, gamcha)

    lleg = create_cylinder(-0.13, 0.48, 0.0, 0.09, 0.85, segments=8, axis='y')
    rleg = create_cylinder(0.13, 0.48, 0.0, 0.09, 0.85, segments=8, axis='y')
    legs = merge_meshes(lleg, rleg)

    lshoe = create_box(-0.13, 0.025, 0.04, 0.13, 0.05, 0.25)
    rshoe = create_box(0.13, 0.025, 0.04, 0.13, 0.05, 0.25)
    chappals = merge_meshes(lshoe, rshoe)

    skin_img = Image.new('RGB', (128, 128), (195, 145, 110))
    mat_skin = builder.add_material("VendorSkin", roughness=0.8, metallic=0.0, texture_image=skin_img)
    builder.add_mesh("VendorHead", head[0], head[1], head[2], head[3], mat_skin)

    cap_img = Image.new('RGB', (64, 64), (180, 150, 120))
    mat_cap = builder.add_material("VendorCap", roughness=0.8, metallic=0.0, texture_image=cap_img)
    builder.add_mesh("VendorCapMesh", cap[0], cap[1], cap[2], cap[3], mat_cap)

    kurta_img = Image.new('RGB', (256, 256), (92, 118, 75))
    mat_kurta = builder.add_material("Kurta", roughness=0.7, metallic=0.0, texture_image=kurta_img)
    builder.add_mesh("KurtaMesh", upper_body[0], upper_body[1], upper_body[2], upper_body[3], mat_kurta)

    pants_img = Image.new('RGB', (128, 128), (40, 65, 95))
    mat_pants = builder.add_material("VendorPants", roughness=0.7, metallic=0.0, texture_image=pants_img)
    builder.add_mesh("VendorLegs", legs[0], legs[1], legs[2], legs[3], mat_pants)

    sandals_img = Image.new('RGB', (64, 64), (60, 40, 25))
    mat_sandals = builder.add_material("Chappals", roughness=0.6, metallic=0.0, texture_image=sandals_img)
    builder.add_mesh("ChappalsMesh", chappals[0], chappals[1], chappals[2], chappals[3], mat_sandals)

    out_path = os.path.join(base_assets, "characters", "street_vendor_realistic.glb")
    builder.build(out_path)
    print("Exported:", out_path)

if __name__ == "__main__":
    generate_coastal_palms()
    generate_tetrapods()
    generate_rooftop_infrastructure()
    generate_civilian_npc()
    generate_traffic_cop()
    generate_street_vendor()
    print("ALL ADDITIONAL MUMBAI ASSETS GENERATED SUCCESSFULLY!")
