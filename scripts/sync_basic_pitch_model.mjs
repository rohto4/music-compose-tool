import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const sourceDirectory = path.resolve('node_modules/@spotify/basic-pitch/model');
const destinationDirectory = path.resolve('public/models/basic-pitch');
const files = ['model.json', 'group1-shard1of1.bin'];

await mkdir(destinationDirectory, { recursive: true });
for (const file of files) {
  const source = path.join(sourceDirectory, file);
  const destination = path.join(destinationDirectory, file);
  const sourceStat = await stat(source);
  let destinationStat = null;
  try { destinationStat = await stat(destination); } catch { /* copy below */ }
  if (!destinationStat || destinationStat.size !== sourceStat.size) await copyFile(source, destination);
}

console.log(JSON.stringify({ model: 'basic-pitch', files, destination: destinationDirectory }));
