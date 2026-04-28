const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function listJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'uploads'].includes(entry.name)) return [];
      return listJsFiles(fullPath);
    }
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

const files = listJsFiles(path.join(__dirname, '..'));
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log(`Syntax OK: ${files.length} JavaScript files checked.`);
