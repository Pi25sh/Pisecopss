import fs from 'fs';

const code = fs.readFileSync('PiSecOps-Mumbai-Open-World/public/mumbai-3d/src/main.js', 'utf8');

async function test() {
  try {
    const parser = await import('../node_modules/@babel/parser/lib/index.js');
    parser.parse(code, { sourceType: 'module' });
    console.log('Babel parsed cleanly!');
  } catch (err) {
    console.log('Babel error:', err.message);
    console.log('Line:', err.loc?.line, 'Column:', err.loc?.column);
    const lines = code.split('\n');
    const l = err.loc ? err.loc.line - 1 : -1;
    if (l >= 0 && l < lines.length) {
      console.log('Context line around error:');
      console.log(lines[l].substring(Math.max(0, err.loc.column - 80), err.loc.column + 80));
      console.log(' '.repeat(Math.min(80, err.loc.column)) + '^');
    }
  }
}

test();
