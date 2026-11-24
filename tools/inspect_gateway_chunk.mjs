import fs from 'fs';

async function checkGatewayRoadsAndCars() {
  // Let's inspect the chunk that contains Gateway of India:
  // Gateway cx = -4786.5, cy = -16385.9
  // In manifest.json: chunk size is 4000m or 1000m? Let's check manifest chunks
  const res = await fetch('http://localhost:5173/mumbai-data/manifest.json');
  const m = await res.json();
  console.log('Chunk size:', m.chunk, 'Tile size:', m.tile);
  
  // Find which chunk contains Gateway
  const [minX, minY] = m.extent;
  const gwX = -4786.5;
  const gwY = -16385.9;
  
  const chunkCol = Math.floor((gwX - minX) / m.chunk);
  const chunkRow = Math.floor((gwY - minY) / m.chunk);
  console.log('Gateway chunk index:', { chunkCol, chunkRow });
  
  const chunk = m.chunks.find(c => c.cx === chunkCol && c.cy === chunkRow);
  console.log('Gateway chunk:', chunk);

  // Check landmarks around Gateway
  const colabaLandmarks = m.landmarks.filter(l => Math.hypot(l.x - gwX, l.y - gwY) < 1500);
  console.log('Landmarks near Gateway:', colabaLandmarks.map(l => ({ id: l.id, kind: l.kind, x: l.x, y: l.y, z: l.z })));
}

checkGatewayRoadsAndCars();
