import fs from 'fs';

const filePath = 'PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/main.js';
let code = fs.readFileSync(filePath, 'utf8');

// Replace with four closing braces
const badSnippet = 'M.instanceMatrix.needsUpdate=!0}}};var fe=200';
const goodSnippet = 'M.instanceMatrix.needsUpdate=!0}}}};var fe=200';

if (code.includes(badSnippet)) {
  code = code.replace(badSnippet, goodSnippet);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Fixed closing brace in main.js!');
} else {
  console.log('badSnippet not found');
}
