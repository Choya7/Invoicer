import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;
const buildDir = path.join(rootDir, 'builded');

console.log('🚀 Starting build and packaging process...');

// 1. Clean up old builded folder
if (fs.existsSync(buildDir)) {
  console.log('Cleaning up old builded folder...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir);

// 2. Build Frontend
console.log('Building Frontend...');
execSync('npm run build', { cwd: path.join(rootDir, 'html'), stdio: 'inherit' });

// 3. Create structure in builded
const backendDest = path.join(buildDir, 'backend');
fs.mkdirSync(backendDest);
const publicDest = path.join(backendDest, 'public');
fs.mkdirSync(publicDest);

// 4. Copy Frontend build to backend/public
console.log('Copying frontend build to backend/public...');
const frontendDist = path.join(rootDir, 'html', 'dist');
copyRecursiveSync(frontendDist, publicDest);

// 5. Copy Backend files
console.log('Copying backend files...');
const backendSrc = path.join(rootDir, 'backend');
const backendFiles = [
  'index.js',
  'package.json',
  '.env',
  'prisma'
];

backendFiles.forEach(file => {
  const src = path.join(backendSrc, file);
  const dest = path.join(backendDest, file);
  if (fs.existsSync(src)) {
    if (fs.lstatSync(src).isDirectory()) {
      copyRecursiveSync(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
});

// 6. Cleanup sensitive or unnecessary files in builded/backend
const dbFile = path.join(backendDest, 'prisma', 'dev.db');
if (fs.existsSync(dbFile)) {
  console.log('Note: dev.db found in builded folder. You may want to replace it with production DB.');
}

console.log('\n✅ Build completed successfully!');
console.log(`Location: ${buildDir}`);
console.log('\nTo run on Mini PC:');
console.log('1. Copy the "backend" folder inside "builded" to your Mini PC.');
console.log('2. Run "npm install" inside that folder.');
console.log('3. Run "npx prisma generate".');
console.log('4. Run "node index.js" to start the server.');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
