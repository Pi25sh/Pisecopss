async function check() {
  const res = await fetch('http://localhost:5173/mumbai-data/manifest.json');
  const m = await res.json();
  const gw = m.landmarks.find(l => l.kind === 'gateway');
  console.log('Gateway landmark in manifest:', gw);
  const taj = m.landmarks.find(l => l.kind === 'taj');
  console.log('Taj landmark in manifest:', taj);
  console.log('Manifest extent:', m.extent);

  const gwLabel = m.labels.find(l => l.n && l.n.includes('Gateway'));
  console.log('Gateway label in manifest:', gwLabel);

  const colabaLabel = m.labels.find(l => l.n && l.n.includes('Colaba'));
  console.log('Colaba label in manifest:', colabaLabel);
}
check();
