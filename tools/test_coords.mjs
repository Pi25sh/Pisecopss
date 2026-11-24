async function test() {
  const res = await fetch('http://localhost:5173/mumbai-data/manifest.json');
  const m = await res.json();
  console.log('Manifest extent:', m.extent);
  
  // Let's check coordinates around Gateway (-4786.5, -16385.9)
  // Remember: Three.js (x, y, z) corresponds to map (x, elevation, -y)
  // So mapX = x, mapY = -z
  console.log('Testing coordinate mapping:');
  const points = [
    { name: 'Gateway Arch', x: -4772, z: 16382 },
    { name: 'Seawall Water Edge', x: -4765, z: 16382 },
    { name: 'Open Water Harbor', x: -4740, z: 16382 },
    { name: 'Promenade Plaza', x: -4805, z: 16386 },
    { name: 'Apollo Bunder Road', x: -4840, z: 16390 },
    { name: 'Taj Mahal Palace Hotel', x: -4925, z: 16405 },
    { name: 'Colaba Causeway', x: -4980, z: 16420 },
    { name: 'Marine Drive Promenade', x: -5800, z: 13000 },
    { name: 'Bandra-Worli Sea Link', x: -4200, z: 3000 }
  ];
  
  for (const p of points) {
    console.log(`${p.name}: Map(${p.x}, ${-p.z}) -> ThreeJS(${p.x}, Y, ${p.z})`);
  }
}
test();
