const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir1 = 'c:\\Users\\Lenovo\\Desktop\\PROJECTS\\TribeV1\\tribe-backend\\src\\app\\api\\trending-creators';
const dir2 = 'c:\\Users\\Lenovo\\Desktop\\PROJECTS\\TribeV1\\tribe-backend\\src\\app\\(protected)\\discover\\trending';

console.log('Creating directories...');
console.log('='.repeat(50));

// Create directory 1
try {
  fs.mkdirSync(dir1, { recursive: true });
  console.log('✓ Directory 1 created successfully');
  console.log(`  ${dir1}`);
} catch (err) {
  console.error(`✗ Directory 1 FAILED: ${err.message}`);
}

// Create directory 2
try {
  fs.mkdirSync(dir2, { recursive: true });
  console.log('✓ Directory 2 created successfully');
  console.log(`  ${dir2}`);
} catch (err) {
  console.error(`✗ Directory 2 FAILED: ${err.message}`);
}

console.log('\nVerification Results:');
console.log('='.repeat(50));

// Verify directory 1
if (fs.existsSync(dir1) && fs.statSync(dir1).isDirectory()) {
  console.log('✓ Directory 1 exists and is accessible');
} else {
  console.log('✗ Directory 1 does NOT exist');
}

// Verify directory 2
if (fs.existsSync(dir2) && fs.statSync(dir2).isDirectory()) {
  console.log('✓ Directory 2 exists and is accessible');
} else {
  console.log('✗ Directory 2 does NOT exist');
}

// Show directory structure
console.log('\nDirectory Structure:');
console.log('='.repeat(50));
const appDir = 'c:\\Users\\Lenovo\\Desktop\\PROJECTS\\TribeV1\\tribe-backend\\src\\app';
try {
  const files = execSync(`dir /s /b "${appDir}"`, { encoding: 'utf-8' });
  console.log(files);
} catch (err) {
  console.log('Could not list directory structure');
}
