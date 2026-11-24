# PiSecOps: Mumbai Open World — Master Game Plan

## Project Overview
- **Title:** PiSecOps – Mumbai Open World
- **Genre:** AAA Browser-Based 3D Third-Person Action-Adventure / Cybercrime Open World
- **Engine / Runtime:** Three.js (WebGL 2.0 / WebGPU ready) + Vite + Modern Browser
- **Target Platform:** Windows PC, Google Chrome / Chromium browsers, 60+ FPS
- **Core Inspiration:** GTA V / Mumbai Gullies freedom and open-world exploration combined with authentic Indian cultural immersion and hard-hitting cybersecurity thriller themes.

---

## Complete Development Phases

### Phase 1 — Core Game Foundation
- **Rendering Engine:** Three.js with WebGLRenderer, `ACESFilmicToneMapping`, `PCFSoftShadowMap`, PBR materials.
- **Third-Person Character Controller:** Smooth velocity interpolation, sprinting (Shift), jumping (Space), climbing obstacles, collision detection against terrain and city props.
- **Input Management:** Keyboard (WASD/Arrows), Mouse Look (Orbit / Pointer Lock), Gamepad API integration.
- **Camera Controller:** Smooth spring-arm follower with building raycast collision clipping avoidance, dynamic vehicle follow camera with speed field-of-view dilation.
- **Save / Load System:** LocalStorage persistence for player health, cash balance, storyline chapter, discovered safehouses, and unlocked vehicles.

### Phase 2 — Mumbai City Environment
- **Districts Modeled:**
  - **Marine Drive & Nariman Point:** Iconic curved Queen's Necklace promenade, Arabian Sea with animated waves, coastal tetrapods, Art Deco buildings, and glass skyscrapers.
  - **Dadar & Girgaon Chawls:** Historic multi-storey chawls with wooden railings, hanging clotheslines, internal courtyards, and narrow lanes.
  - **Crawford Market & Colaba Causeway:** Bustling bazaar streets, fruit vendors, chaat carts, colorful umbrellas, and street signage.
  - **Koliwada Fishing Village:** Vibrant turquoise, yellow, and magenta coastal houses, fishing docks, and wooden boats.
  - **Railway Infrastructure:** Western & Central line tracks with elevated flyovers, overhead catenary wire towers, and moving local trains.
- **Day / Night & Weather Cycle:**
  - Dynamic sun progression from golden hour dawn to blazing midday, vivid Mumbai sunset, and neon-lit monsoon night.
  - Directional PCF shadows, coastal marine fog, and puddle wet-road specular highlights.

### Phase 3 — Characters and Vehicles
- **Protagonist (PiSecOps):**
  - Young Indian cybersecurity prodigy in dark navy hoodie with bold white $\pi$ symbol, neon sleeve piping, crossbody tactical sling bag, black cargo pants, and sneakers.
- **Street Wildlife & NPCs:**
  - Street cows peacefully resting or grazing near markets.
  - Mumbai street dogs (sleeping on pavements and walking around stalls).
  - Civilian locals walking along footpaths with varied outfits.
  - Mumbai Traffic Police in high-visibility neon raincoats and white peak caps.
  - Local street vendors with red/white gamcha towels serving cutting chai and street snacks.
- **Drivable Vehicle System:**
  - **Mumbai Taxi (Kaali-Peeli):** Authentic black body, yellow roof, chrome bumper, roof luggage rack.
  - **Auto-Rickshaw:** 3-wheeler with tight steering angle, yellow canopy, and digital meter.
  - **Mumbai Police SUV:** Scorpio/Bolero patrol unit with dual flashing red/blue light bars and siren.
  - **BEST Bus:** Municipal red single-decker public transit coach.
  - **Commuter Motorcycle:** Agile 100cc Indian street bike for weaving through congested traffic.
  - **Entering & Exiting:** Press `F` near any vehicle to enter driver's seat; press `F` again to disembark.
- **Traffic AI & Pedestrian Navigation:**
  - Vehicles navigate road networks obeying lane dividers, stopping behind vehicles, and yielding to crossing pedestrians.

### Phase 4 — Gameplay & Cybercrime Storyline
- **Central Plot — "Operation Cyber Fortress":**
  - PiSecOps uncovers an underground syndicate deploying zero-day ransomware across Mumbai's banking hubs, port terminals, and power grids.
- **Mission Progression:**
  - *Mission 1: The Marine Drive Data Tap* — Tap into rogue fiber junction boxes along the promenade before police patrols arrive.
  - *Mission 2: Chawl Syndicate Breach* — Infiltrate a criminal cyber-den inside a Dadar chawl and recover stolen encrypted hard drives.
  - *Mission 3: High-Speed Port Pursuit* — Intercept an armored courier van heading towards the docks before data is exfiltrated abroad.
- **Police & Wanted System (1 to 5 Stars):**
  - GTA-style escalating response: patrol officers -> rapid response SUVs -> roadblocks -> full SWAT tactical pursuit.
- **Smartphone & Hacking Rig:**
  - Openable cyber smartphone (press `M` or `Tab`) with Terminal CLI, GPS City Map, Network Sniffer, and Wanted Level Tracker.

### Phase 5 — Visuals & Performance Optimization
- **PBR Materials:** Photorealistic high-resolution aggregate asphalt, herringbone stone promenade, black-yellow curb stones, and wave normal maps.
- **LOD (Level of Detail):** Distance-based mesh degradation for distant skyscrapers and props.
- **Instanced Mesh Rendering:** High-performance instancing for palm trees, tetrapods, streetlights, and traffic barricades to guarantee smooth 60 FPS on mid-range GPUs.
- **Tone Mapping:** `ACESFilmicToneMapping` with warm ambient balance to mirror Mumbai's cinematic coastal atmosphere.

### Phase 6 — Testing & Packaging
- **Chrome / Windows PC Optimization:** Zero dropped frames during high-speed driving or crowded market exploration.
- **Automated Verification:** Continuous headless browser testing with automated screenshot capture, console log error monitoring, and memory profiling.
