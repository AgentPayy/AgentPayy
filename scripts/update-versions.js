#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node update-versions.js <version>');
  process.exit(1);
}

console.log(`🔄 Updating versions to ${version}`);

// Update package.json files
const packages = [
  'package.json',
  'contracts/package.json'
];

packages.forEach(packagePath => {
  const fullPath = path.join(process.cwd(), packagePath);
  if (fs.existsSync(fullPath)) {
    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    pkg.version = version;
    fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ Updated ${packagePath}`);
  }
});

// Update Python setup.py
const setupPyPath = path.join(process.cwd(), 'sdk/python/setup.py');
if (fs.existsSync(setupPyPath)) {
  let setupContent = fs.readFileSync(setupPyPath, 'utf8');
  setupContent = setupContent.replace(
    /version="[^"]+"/,
    `version="${version}"`
  );
  fs.writeFileSync(setupPyPath, setupContent);
  console.log(`✅ Updated sdk/python/setup.py`);
}

console.log(`🎉 All versions updated to ${version}`); 