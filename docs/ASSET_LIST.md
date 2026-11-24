# PiSecOps: Mumbai Open World — 3D Asset Inventory

All 3D assets are bundled as standard glTF 2.0 Binary (`.glb`) with embedded PBR textures, normal maps, and materials in `public/assets/`.

---

## 1. Character Assets (`public/assets/characters/`)

| Asset File | Polycount | Textures | Visual Description |
|------------|-----------|----------|--------------------|
| `pisecops_character_realistic.glb` | ~3,500 | Navy hoodie with $\pi$ logo, cargo pants, sneakers | Main playable protagonist in modern Indian streetwear with tactical sling bag. |
| `civilian_npc_realistic.glb` | ~2,800 | Blue button-down shirt, chinos, leather shoes | Ordinary Mumbai civilian pedestrian for sidewalks and market lanes. |
| `traffic_cop_realistic.glb` | ~3,100 | Neon high-vis raincoat, white peak cap, police badge | Mumbai Traffic Police officer directing traffic and responding to crimes. |
| `street_vendor_realistic.glb` | ~2,900 | Olive kurta, red/white checkered gamcha, lungi/jeans | Authentic street vendor running tea tapris and chaat stalls. |
| `mumbai_cow_realistic.glb` | 8.55 MB | High-detail photorealistic cow skin & horn textures | Sacred Indian street cow resting on promenades and street medians. |
| `sleeping_dog_realistic.glb` | 13.65 MB | Photogrammetry textured sleeping street dog | Street dog curled up asleep under shade on pedestrian sidewalks. |
| `standing_dog_realistic.glb` | 13.19 MB | High-res realistic canine mesh & fur map | Street dog walking near market stalls and alleys. |

---

## 2. Vehicle Assets (`public/assets/vehicles/`)

| Asset File | Category | Special Features | In-Game Role |
|------------|----------|------------------|--------------|
| `mumbai_taxi_realistic.glb` | Taxi (Kaali-Peeli) | Yellow roof, black body, chrome grille, roof rack | Drivable player taxi & street traffic vehicle. |
| `auto_rickshaw_realistic.glb` | 3-Wheeler Auto | Yellow canvas hood, open sides, fare meter | Drivable agile auto rickshaw for narrow chawl alleys. |
| `mumbai_police_suv.glb` | Police Cruiser | Dual red/blue strobe beacons, push bar, sirens | Police pursuit patrol unit responding to wanted stars. |
| `best_bus_realistic.glb` | Municipal Bus | Iconic Mumbai red coach with destination board | Heavy urban road traffic vehicle. |
| `mumbai_motorcycle_realistic.glb` | Commuter Bike | 100cc Indian street bike, alloy wheels | Drivable agile two-wheeler for traffic filtering. |

---

## 3. Architecture & Buildings (`public/assets/buildings/`)

| Asset File | Architecture Style | Details | Placement |
|------------|--------------------|---------|-----------|
| `mumbai_urban_building_aaa.glb` | 6-Storey Mumbai Commercial-Residential | 3 Ground commercial shops with corrugated shutters, Indian entrance gate, 5 residential floors with balconies, railings, hanging laundry, AC compressors, PVC downspouts, rooftop mumty, Sintex water tanks, satellite dishes & TV antenna. PBR 2K maps. | Main commercial avenue & Dadar gateway boulevard. |
| `mumbai_urban_building_lod0.glb` | 6-Storey Mumbai Commercial-Residential (LOD0) | Full ultra-detail geometry (~32K polys) with all 3D AC units, railings, laundry, pipes. | Primary visual focus and close encounters (< 35m). |
| `mumbai_urban_building_aaa_lod1.glb` | 6-Storey Mumbai Commercial-Residential (LOD1) | Mid-range LOD with consolidated railings and simplified AC units (~10K polys). | Mid-range distance (35m - 80m). |
| `mumbai_urban_building_aaa_lod2.glb` | 6-Storey Mumbai Commercial-Residential (LOD2) | Distant silhouette LOD with baked PBR albedo/normal textures (~1.5K polys). | Distant skyline (> 80m). |
| `chawl_building_realistic.glb` | Historic Mumbai Chawl | 3-storey wooden galleries, drying sari clotheslines | Dadar & Girgaon residential districts. |
| `mumbai_glass_skyscraper.glb` | Modern Corporate High-Rise | Reflective curtain glass, rooftop helipad | Nariman Point, Lower Parel business hub. |
| `residential_building_realistic.glb` | Mid-Rise Apartment Block | Concrete balconies, water tanks, air conditioners | Suburban streets and main avenues. |
| `koliwada_houses.glb` | Coastal Fishing Settlement | Vibrant blue, yellow, and magenta painted dwellings | Coastal shoreline and docks. |

---

## 4. Environment & Infrastructure (`public/assets/environment/`)

| Asset File | Description | Details |
|------------|-------------|---------|
| `mumbai_local_train.glb` | Western/Central Railway EMU Train | Iconic yellow-and-purple local train with open passenger doors running along railway corridors. |

---

## 5. Street Props & Vegetation (`public/assets/props/`)

| Asset File | Category | Details |
|------------|----------|---------|
| `cutting_chai_stall.glb` | Street Food | Traditional tea tapri with brass kettle, cutting chai glasses, stove, and biscuit jars. |
| `mumbai_chaat_cart.glb` | Street Food | Mobile wooden cart with colorful canvas umbrella, giant steel tava, and LPG cylinder. |
| `coastal_palms_vegetation.glb` | Nature | Arching tropical coconut palm trees lining the Marine Drive promenade. |
| `tetrapod_seawall.glb` | Coastal Marine | Giant 4-legged concrete tetrapod breakwaters guarding the shoreline against Arabian Sea waves. |
| `rooftop_infrastructure.glb` | Utilities | Black Sintex water tanks, outdoor split AC compressor units, satellite television dish antennas. |
| `mumbai_street_props.glb` | Street Furniture | Traffic signals, sodium streetlights, municipal dustbins, yellow police barricades. |

---

## 6. Photorealistic PBR Textures (`public/assets/textures/`)

| Texture File | Resolution | Application |
|--------------|------------|-------------|
| `asphalt_road_pbr.png` | 1024x1024 | Asphalt roadway with tire wear lanes, double yellow divider, dashed white traffic lines. |
| `promenade_paving_pbr.png` | 1024x1024 | Marine Drive Queen's Necklace interlocking stone pavers with recessed mortar joints. |
| `curb_hazard_pbr.png` | 512x256 | Authentic Indian municipal alternating black and yellow hazard painted curb stones. |
| `water_normal.png` | 512x512 | Multi-frequency Arabian Sea wave normal map for dynamic sunlight specular reflections. |
| `sky_panorama.png` | 2048x1024 | Mumbai coastal sky panorama with golden hour horizon glow, soft cumulus clouds, and sun flare. |
