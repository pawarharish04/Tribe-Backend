#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the directories to create
const baseDir = 'c:\\Users\\Lenovo\\Desktop\\PROJECTS\\TribeV1\\tribe-backend\\src\\app';
const dir1 = path.join(baseDir, 'api', 'trending-creators');
const dir2 = path.join(baseDir, '(protected)', 'discover', 'trending');

console.log('Creating directories...');
console.log('='.repeat(60));

// Create directory 1
try {
  fs.mkdirSync(dir1, { recursive: true });
  console.log('✓ Directory 1 created successfully');
  console.log(`  ${dir1}`);
} catch (err) {
  console.error(`✗ Directory 1 FAILED: ${err.message}`);
  process.exit(1);
}

// Create directory 2
try {
  fs.mkdirSync(dir2, { recursive: true });
  console.log('✓ Directory 2 created successfully');
  console.log(`  ${dir2}`);
} catch (err) {
  console.error(`✗ Directory 2 FAILED: ${err.message}`);
  process.exit(1);
}

console.log('\nVerification Results:');
console.log('='.repeat(60));

// Verify directory 1
try {
  const stat1 = fs.statSync(dir1);
  if (stat1.isDirectory()) {
    console.log('✓ Directory 1 exists and is accessible');
  }
} catch (err) {
  console.error(`✗ Directory 1 verification failed: ${err.message}`);
  process.exit(1);
}

// Verify directory 2
try {
  const stat2 = fs.statSync(dir2);
  if (stat2.isDirectory()) {
    console.log('✓ Directory 2 exists and is accessible');
  }
} catch (err) {
  console.error(`✗ Directory 2 verification failed: ${err.message}`);
  process.exit(1);
}

console.log('\nDirectory Structure:');
console.log('='.repeat(60));

// List the created directories
function listDirs(dirPath, prefix = '') {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    items.forEach((item) => {
      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(baseDir, fullPath);
      if (item.isDirectory()) {
        console.log(`${prefix}📁 ${relativePath}`);
        listDirs(fullPath, prefix + '  ');
      }
    });
  } catch (err) {
    console.error(`Error reading directory: ${err.message}`);
  }
}

console.log(`Base directory: ${baseDir}`);
listDirs(baseDir);

console.log('\n✓ Both directories created and verified successfully!');
