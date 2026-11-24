const fs = require('fs');
const js = fs.readFileSync('d:/bombaii thefts/mumbai_3d_main.js', 'utf8');
const idx = js.indexOf('let h=U("places")');
console.log(js.slice(idx, idx + 500));
