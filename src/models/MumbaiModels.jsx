import React from 'react';
import { useGLTF, useFBX, useAnimations } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Preload all 3D GLB assets for zero-stutter rendering
const ASSET_PATHS = {
  // Characters & Animals
  pisecops: '/assets/characters/pisecops_character_realistic.glb',
  ch42: '/assets/characters/ch42_animated_protagonist.glb',
  cow: '/assets/characters/mumbai_cow_realistic.glb',
  sleepingDog: '/assets/characters/sleeping_dog_realistic.glb',
  standingDog: '/assets/characters/standing_dog_realistic.glb',
  civilian: '/assets/characters/civilian_npc_realistic.glb',
  trafficCop: '/assets/characters/traffic_cop_realistic.glb',
  streetVendor: '/assets/characters/street_vendor_realistic.glb',

  // Vehicles
  taxi: '/assets/vehicles/mumbai_taxi_realistic.glb',
  autoRickshaw: '/assets/vehicles/auto_rickshaw_realistic.glb',
  policeSUV: '/assets/vehicles/mumbai_police_suv.glb',
  bestBus: '/assets/vehicles/best_bus_realistic.glb',
  motorcycle: '/assets/vehicles/mumbai_motorcycle_realistic.glb',

  // Buildings
  gateway: '/assets/buildings/gateway_of_india.glb',
  buildingAAA: '/assets/buildings/mumbai_urban_building_aaa.glb',
  chawl: '/assets/buildings/chawl_building_realistic.glb',
  skyscraper: '/assets/buildings/mumbai_glass_skyscraper.glb',
  residential: '/assets/buildings/residential_building_realistic.glb',
  koliwada: '/assets/buildings/koliwada_houses.glb',

  // Props & Nature
  chaiStall: '/assets/props/cutting_chai_stall.glb',
  chaatCart: '/assets/props/mumbai_chaat_cart.glb',
  palms: '/assets/props/coastal_palms_vegetation.glb',
  tetrapods: '/assets/props/tetrapod_seawall.glb',
  rooftop: '/assets/props/rooftop_infrastructure.glb',
  streetProps: '/assets/props/mumbai_street_props.glb',

  // Railway
  localTrain: '/assets/environment/mumbai_local_train.glb'
};

// Preload every model into Drei cache
Object.values(ASSET_PATHS).forEach((path) => {
  if (path.toLowerCase().endsWith('.fbx')) {
    useFBX.preload(path);
  } else {
    useGLTF.preload(path);
  }
});

function FbxModelRenderer({ path, scale, ...props }) {
  const fbx = useFBX(path);
  const cloned = React.useMemo(() => {
    const c = SkeletonUtils.clone(fbx);
    c.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [fbx]);
  // Mixamo FBX models are exported in centimeter scale (100x), so default to 0.01 if scale is 1
  const s = Array.isArray(scale) ? scale : [scale * 0.01, scale * 0.01, scale * 0.01];
  return <primitive object={cloned} scale={s} {...props} />;
}

function GltfModelRenderer({ path, scale, ...props }) {
  const { scene } = useGLTF(path);
  const cloned = React.useMemo(() => {
    let hasSkinnedMesh = false;
    scene.traverse((c) => {
      if (c.isSkinnedMesh) hasSkinnedMesh = true;
    });
    const c = hasSkinnedMesh ? SkeletonUtils.clone(scene) : scene.clone(true);
    c.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  const s = Array.isArray(scale) ? scale : [scale, scale, scale];
  return <primitive object={cloned} scale={s} {...props} />;
}

/**
 * Universal 3D Model Component powered by @react-three/drei
 * Supports both standard GLB/GLTF models and Mixamo FBX characters
 */
export function MumbaiModel({ modelKey, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, ...props }) {
  const path = ASSET_PATHS[modelKey];
  if (!path) {
    console.warn(`Model key "${modelKey}" not found in ASSET_PATHS.`);
    return null;
  }
  const isFbx = path.toLowerCase().endsWith('.fbx');

  return (
    <group position={position} rotation={rotation} {...props}>
      {isFbx ? (
        <FbxModelRenderer path={path} scale={scale} />
      ) : (
        <GltfModelRenderer path={path} scale={scale} />
      )}
    </group>
  );
}

// Named React components for specific open-world assets
export function PiSecOpsCharacter(props) {
  return <MumbaiModel modelKey="pisecops" {...props} />;
}

export function MumbaiCow(props) {
  return <MumbaiModel modelKey="cow" {...props} />;
}

export function SleepingDog(props) {
  return <MumbaiModel modelKey="sleepingDog" {...props} />;
}

export function StandingDog(props) {
  return <MumbaiModel modelKey="standingDog" {...props} />;
}

export function CivilianNPC(props) {
  return <MumbaiModel modelKey="civilian" {...props} />;
}

export function TrafficCop(props) {
  return <MumbaiModel modelKey="trafficCop" {...props} />;
}

export function StreetVendor(props) {
  return <MumbaiModel modelKey="streetVendor" {...props} />;
}

export function MumbaiTaxi(props) {
  return <MumbaiModel modelKey="taxi" {...props} />;
}

export function AutoRickshaw(props) {
  return <MumbaiModel modelKey="autoRickshaw" {...props} />;
}

export function PoliceSUV(props) {
  return <MumbaiModel modelKey="policeSUV" {...props} />;
}

export function BestBus(props) {
  return <MumbaiModel modelKey="bestBus" {...props} />;
}

export function Motorcycle(props) {
  return <MumbaiModel modelKey="motorcycle" {...props} />;
}

export function MumbaiUrbanBuildingAAA(props) {
  return <MumbaiModel modelKey="buildingAAA" {...props} />;
}

export function ChawlBuilding(props) {
  return <MumbaiModel modelKey="chawl" {...props} />;
}

export function GlassSkyscraper(props) {
  return <MumbaiModel modelKey="skyscraper" {...props} />;
}

export function ResidentialBuilding(props) {
  return <MumbaiModel modelKey="residential" {...props} />;
}

export function KoliwadaHouses(props) {
  return <MumbaiModel modelKey="koliwada" {...props} />;
}

export function CuttingChaiStall(props) {
  return <MumbaiModel modelKey="chaiStall" {...props} />;
}

export function ChaatCart(props) {
  return <MumbaiModel modelKey="chaatCart" {...props} />;
}

export function CoastalPalms(props) {
  return <MumbaiModel modelKey="palms" {...props} />;
}

export function TetrapodSeawall(props) {
  return <MumbaiModel modelKey="tetrapods" {...props} />;
}

export function RooftopInfrastructure(props) {
  return <MumbaiModel modelKey="rooftop" {...props} />;
}

export function StreetProps(props) {
  return <MumbaiModel modelKey="streetProps" {...props} />;
}

export function MumbaiLocalTrain(props) {
  return <MumbaiModel modelKey="localTrain" {...props} />;
}
