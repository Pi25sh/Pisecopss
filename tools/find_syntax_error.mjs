import fs from 'fs';
import { parse } from 'node:path';

const code = fs.readFileSync('PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/main.js', 'utf8');

// Use native dynamic import / vm to parse ES module
import('node:vm').then(vm => {
  try {
    const mod = new vm.SourceTextModule(code);
    console.log('SourceTextModule created successfully!');
  } catch (err) {
    console.error('Parse error:', err.message);
    if (err.stack) {
      const lines = err.stack.split('\n');
      console.error(lines.slice(0, 5).join('\n'));
    }
  }
});
