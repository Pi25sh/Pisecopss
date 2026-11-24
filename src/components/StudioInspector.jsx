import React, { useState, Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Sky, Html } from '@react-three/drei';
import { MumbaiModel } from '../models/MumbaiModels.jsx';

export const MODELS_CATALOG = [
  {
    id: 'gateway',
    name: 'Gateway of India (Official CyArk Heritage Scan)',
    category: 'Featured AAA',
    scale: 0.08,
    target: [0.16, 1.5, 0.15],
    camPos: [5.2, 3.2, 6.2],
    specs: {
      triangles: '74,500',
      materials: 'Photogrammetric Indo-Saracenic Yellow Basalt Stone PBR',
      features: 'Authentic 26m triumphal arch, 4 corner turrets, intricate jali lattice stonework, dome vaulting',
      authenticity: 'Official CyArk & Google Arts LiDAR photogrammetric heritage preservation scan'
    }
  },
  {
    id: 'buildingAAA',
    name: 'Mumbai Urban Building (AAA 6-Storey)',
    category: 'Featured AAA',
    scale: 0.28,
    target: [0, 2.8, 0],
    camPos: [8.5, 5.8, 11.5],
    specs: {
      triangles: '48,200',
      materials: 'PBR Concrete, Corrugated Shutters, Glass Grille, SINTEX, Laundry',
      features: 'Open-work balusters, hanging laundry drapes, AC compressors, PVC downspouts, Sintex rooftop tanks',
      authenticity: 'Authentic 6-floor residential-commercial Mumbai chawl/apartment'
    }
  },
  {
    id: 'autoRickshaw',
    name: 'Auto-Rickshaw (Bajaj RE 3-Wheeler)',
    category: 'Vehicles',
    scale: 1.0,
    target: [0, 0.85, 0],
    camPos: [3.2, 1.8, 3.8],
    specs: {
      triangles: '12,600',
      materials: 'PBR Yellow/Black Body, Chrome Rails, Vinyl Seats, Tread Rubber',
      features: 'Curved yellow canopy, front visor brim, fare meter, open doorways, grab rails, rear bench',
      authenticity: 'Iconic Mumbai 3-wheeler auto-rickshaw with MH-02 registration'
    }
  },
  {
    id: 'taxi',
    name: 'Mumbai Kaali-Peeli Taxi (Premier Padmini)',
    category: 'Vehicles',
    scale: 1.0,
    target: [0, 0.80, 0],
    camPos: [4.2, 2.0, 4.8],
    specs: {
      triangles: '16,400',
      materials: 'Two-Tone Automotive Gloss, Chrome Grille/Bumpers, Safety Glass',
      features: 'Canary yellow roof, roof luggage rack carrier, vintage round headlamps, external fare meter',
      authenticity: 'Classic Premier Padmini Mumbai taxi with MH-01 yellow commercial plate'
    }
  },
  {
    id: 'motorcycle',
    name: 'Hero Splendor Commuter Motorcycle',
    category: 'Vehicles',
    scale: 1.0,
    target: [0, 0.65, 0],
    camPos: [2.4, 1.4, 2.6],
    specs: {
      triangles: '8,900',
      materials: 'Pinstripe Black Paint, Chrome Silencer Heat Shield, Rubber Tires',
      features: '100cc engine block with cooling fins, high commuter handlebars, dual rear shocks, spoke wheels',
      authenticity: 'The undisputed commuter king of Mumbai streets'
    }
  },
  {
    id: 'bestBus',
    name: 'BEST Red Municipal Bus',
    category: 'Vehicles',
    scale: 0.65,
    target: [0, 1.4, 0],
    camPos: [7.8, 3.2, 8.8],
    specs: {
      triangles: '18,800',
      materials: 'BEST Cherry Red / Cream Livery, Steel Bumpers, Commercial Tires',
      features: 'Route 123 Mantraalaya destination marquee, dual accordion folding doors, dual rear wheels',
      authenticity: 'Brihanmumbai Electric Supply and Transport municipal lifeline bus'
    }
  },
  {
    id: 'chaatCart',
    name: 'Girgaon Chaat Cart (with Indane LPG)',
    category: 'Street Life',
    scale: 1.0,
    target: [0, 1.0, 0],
    camPos: [2.8, 1.8, 3.2],
    specs: {
      triangles: '9,400',
      materials: 'Painted Timber, Indane Red Steel, Polished Tava Griddle, Glass',
      features: 'Indane 14.2kg domestic gas cylinder with hose, convex tava, puri showcase, hand-painted marquee',
      authenticity: 'Authentic Chowpatty & Juhu beach street food vendor pushcart'
    }
  },
  {
    id: 'streetProps',
    name: 'Overhead Utility Pole & Tangled Cables',
    category: 'Infrastructure',
    scale: 0.72,
    target: [0, 3.2, 0],
    camPos: [5.2, 3.8, 6.2],
    specs: {
      triangles: '14,200',
      materials: 'Weathered Concrete, Galvanized Metal, 3-Aspect Traffic Lights',
      features: 'Catenary drooped utility wires, distribution transformer, ceramic insulators, traffic signal',
      authenticity: 'Iconic tangled electrical wiring signature of Mumbai avenues'
    }
  },
  {
    id: 'ch42',
    name: 'Mixamo Ch42 (Active Protagonist)',
    category: 'Characters',
    scale: 1.0,
    target: [0, 0.95, 0],
    camPos: [2.2, 1.4, 2.8],
    specs: {
      triangles: '42,000',
      materials: 'Diffuse, Specular, Glossiness, Normal Maps',
      features: 'Full humanoid skeletal rig animated with Mixamo Walking & Running motion tracks',
      authenticity: 'Cinematic AAA character provided by user from Mixamo'
    }
  },
  {
    id: 'pisecops',
    name: 'PiSecOps Protagonist (Denim & Satchel)',
    category: 'Characters',
    scale: 1.0,
    target: [0, 1.0, 0],
    camPos: [1.8, 1.2, 2.4],
    specs: {
      triangles: '7,800',
      materials: 'Charcoal Denim Jacket, Maroon Henley, Leather Satchel, Cargo Khakis',
      features: 'Crossbody messenger bag, combat boots, wristwatch, athletic modern hero build',
      authenticity: 'Main playable hero crafted for PiSecOps Mumbai storyline'
    }
  },
  {
    id: 'trafficCop',
    name: 'Mumbai Traffic Police (Neon Rain Gear)',
    category: 'NPCs',
    scale: 1.0,
    target: [0, 1.0, 0],
    camPos: [1.8, 1.2, 2.4],
    specs: {
      triangles: '6,400',
      materials: 'Fluorescent Neon Yellow-Green, 3M Retroreflective Stripes, Peak Cap',
      features: 'Monsoon high-visibility raincoat, white police cap with gold badge, duty boots',
      authenticity: 'Mumbai Traffic Branch officer regulating Marine Drive junctions'
    }
  },
  {
    id: 'streetVendor',
    name: 'Street Food Vendor (Kurta & Gamcha)',
    category: 'NPCs',
    scale: 1.0,
    target: [0, 1.0, 0],
    camPos: [1.8, 1.2, 2.4],
    specs: {
      triangles: '5,800',
      materials: 'Olive Green Cotton Kurta, Red-Checked Gamcha Towel, Denim Jeans',
      features: 'Traditional gamcha shoulder drape, vendor cap, button placket, sandals',
      authenticity: 'Hardworking street stall vendor / Dabbawala of Girgaon'
    }
  },
  {
    id: 'cow',
    name: 'Mumbai Cow (Sacred Animal)',
    category: 'Wildlife',
    scale: 1.0,
    target: [0, 0.8, 0],
    camPos: [2.8, 1.5, 3.2],
    specs: {
      triangles: '24,000',
      materials: 'Realistic Cow Hide & Horns PBR Material',
      features: 'Photorealistic Indian street cow grazing calmly on promenade edges',
      authenticity: 'Real 3D model asset provided by user'
    }
  },
  {
    id: 'sleepingDog',
    name: 'Sleeping Street Dog',
    category: 'Wildlife',
    scale: 1.0,
    target: [0, 0.25, 0],
    camPos: [1.4, 0.7, 1.6],
    specs: {
      triangles: '32,000',
      materials: 'Photorealistic Fur & Anatomy PBR',
      features: 'Curled up sleeping Mumbai street dog napping near chai stalls',
      authenticity: 'Real 3D model asset provided by user'
    }
  },
  {
    id: 'standingDog',
    name: 'Standing Greyhound Dog',
    category: 'Wildlife',
    scale: 1.0,
    target: [0, 0.45, 0],
    camPos: [1.8, 0.9, 2.0],
    specs: {
      triangles: '31,000',
      materials: 'Photorealistic Coat & Skeletal Structure',
      features: 'Alert street dog roaming Mumbai pavements',
      authenticity: 'Real 3D model asset provided by user'
    }
  }
];

function CameraDirector({ target, camPos }) {
  const { camera } = useThree();

  useEffect(() => {
    if (camPos && target) {
      camera.position.set(camPos[0], camPos[1], camPos[2]);
      camera.lookAt(target[0], target[1], target[2]);
      camera.updateProjectionMatrix();
    }
  }, [camPos, target, camera]);

  return null;
}

function ModelWrapper({ model }) {
  return (
    <Suspense
      fallback={
        <Html center>
          <div style={{ color: '#00f0ff', fontFamily: 'monospace', fontSize: '13px', background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '4px' }}>
            LOADING 3D GLTF BUFFERS...
          </div>
        </Html>
      }
    >
      <MumbaiModel modelKey={model.id} scale={model.scale} position={[0, 0, 0]} />
    </Suspense>
  );
}

export function StudioInspector({ onEnterGame, onEnterMumbai3D }) {
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialModel = urlParams.get('model') || 'autoRickshaw';
  const [selectedId, setSelectedId] = useState(initialModel);
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightingPreset, setLightingPreset] = useState('sunset'); // sunset, night, daylight

  const currentModel = MODELS_CATALOG.find((m) => m.id === selectedId) || MODELS_CATALOG[0];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#070b14', overflow: 'hidden' }}>
      {/* 3D Canvas powered by @react-three/fiber */}
      <Canvas
        camera={{ position: currentModel.camPos || [8.5, 6.0, 11.5], fov: 42 }}
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <CameraDirector target={currentModel.target} camPos={currentModel.camPos} />

        <ambientLight intensity={lightingPreset === 'night' ? 0.25 : lightingPreset === 'daylight' ? 0.9 : 0.65} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={lightingPreset === 'night' ? 0.3 : lightingPreset === 'daylight' ? 2.8 : 2.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {lightingPreset === 'night' ? (
          <color attach="background" args={['#050811']} />
        ) : (
          <Sky
            distance={450000}
            sunPosition={lightingPreset === 'sunset' ? [100, 10, 50] : [0, 120, 80]}
            inclination={lightingPreset === 'sunset' ? 0.49 : 0.2}
            azimuth={0.25}
          />
        )}

        <ModelWrapper model={currentModel} />

        <ContactShadows position={[0, 0, 0]} opacity={0.7} scale={15} blur={1.8} far={4.5} />

        <OrbitControls
          makeDefault
          target={currentModel.target || [0, 1.0, 0]}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          minDistance={1.0}
          maxDistance={35}
          maxPolarAngle={Math.PI / 2 + 0.05}
        />
      </Canvas>

      {/* Top Header */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 25,
          zIndex: 10,
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px' }}>
          PISECOPS <span style={{ color: '#00f0ff' }}>3D ASSET STUDIO</span>
        </div>
        <div style={{ color: '#88aacc', fontSize: '12px', marginTop: '4px' }}>
          POWERED BY THREE.JS / @REACT-THREE/FIBER / @REACT-THREE/DREI
        </div>
      </div>

      {/* Top Right Controls & Switch to Open World */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 25,
          zIndex: 10,
          display: 'flex',
          gap: '12px'
        }}
      >
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          style={{
            background: 'rgba(12, 20, 32, 0.85)',
            border: '1px solid #1a3c5a',
            color: autoRotate ? '#00f0ff' : '#8899aa',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {autoRotate ? 'ROTATING ON' : 'PAUSED'}
        </button>

        <button
          onClick={() =>
            setLightingPreset((prev) => (prev === 'sunset' ? 'night' : prev === 'night' ? 'daylight' : 'sunset'))
          }
          style={{
            background: 'rgba(12, 20, 32, 0.85)',
            border: '1px solid #1a3c5a',
            color: '#ffaa00',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          LIGHT: {lightingPreset.toUpperCase()}
        </button>

        <button
          onClick={onEnterMumbai3D}
          style={{
            background: 'rgba(255, 180, 84, 0.2)',
            border: '1px solid #ffb454',
            color: '#ffd9a0',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 0 12px rgba(255,180,84,0.3)'
          }}
        >
          🗺️ MUMBAI 3D MAP
        </button>

        <button
          onClick={onEnterGame}
          style={{
            background: '#00f0ff',
            border: 'none',
            color: '#050a14',
            padding: '8px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '900',
            letterSpacing: '1px',
            boxShadow: '0 0 15px rgba(0,240,255,0.5)'
          }}
        >
          PLAY OPEN WORLD ▶
        </button>
      </div>

      {/* Model Specs Overlay Panel (Left Side) */}
      <div
        style={{
          position: 'absolute',
          top: 85,
          left: 25,
          maxWidth: '340px',
          background: 'rgba(8, 14, 24, 0.88)',
          border: '1px solid #1a3c5a',
          borderRadius: '12px',
          padding: '16px 20px',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>
          {currentModel.category.toUpperCase()} // ASSET INSPECTOR
        </div>
        <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
          {currentModel.name}
        </div>
        <div style={{ color: '#88aacc', fontSize: '12px', marginTop: '6px', lineHeight: '1.4' }}>
          {currentModel.specs?.authenticity}
        </div>

        <div style={{ marginTop: '12px', borderTop: '1px solid #19304a', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', color: '#6888aa' }}>KEY DETAILS & GEOMETRY:</div>
          <div style={{ fontSize: '12px', color: '#c8dcfa', marginTop: '2px' }}>
            {currentModel.specs?.features}
          </div>
        </div>

        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '11px', color: '#6888aa' }}>PBR MATERIALS:</div>
          <div style={{ fontSize: '11px', color: '#cad8e6', marginTop: '2px', fontFamily: 'monospace' }}>
            {currentModel.specs?.materials}
          </div>
        </div>

        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00f0ff' }}>
          <span>POLYGONS: ~{currentModel.specs?.triangles} tris</span>
          <span>FORMAT: GLB 2.0</span>
        </div>
      </div>

      {/* Bottom Model Selector Shelf */}
      <div
        style={{
          position: 'absolute',
          bottom: 25,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '94%',
          background: 'rgba(8, 14, 24, 0.92)',
          border: '1px solid #1a3c5a',
          borderRadius: '16px',
          padding: '12px 20px',
          zIndex: 10,
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
        }}
      >
        {MODELS_CATALOG.map((m) => {
          const isSel = m.id === selectedId;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              style={{
                flexShrink: 0,
                background: isSel ? '#00f0ff' : 'rgba(15, 26, 42, 0.8)',
                color: isSel ? '#050a14' : '#cad8e6',
                border: isSel ? '1px solid #fff' : '1px solid #20354e',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '10px', color: isSel ? '#003344' : '#6888aa', fontWeight: 'bold' }}>
                {m.category.toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>{m.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
