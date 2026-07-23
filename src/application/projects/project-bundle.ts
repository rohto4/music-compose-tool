import JSZip from 'jszip';
import { markProjectSaved, migrateProject } from '../../domain/music';
import type { Project } from '../../domain/music';
import type { AudioAssetRepository } from '../audio/audio-asset-repository';
import type { UserAudioAssetMetadata } from '../../domain/audio';
import type { HummingAssetRepository } from '../humming/humming-ports';

const BUNDLE_FORMAT = 'patchtone-project-bundle';
const BUNDLE_VERSION = 1;
const PROJECT_PATH = 'project.json';
const MAX_PROJECT_BUNDLE_BYTES = 256 * 1024 * 1024;

interface ProjectBundleManifest {
  format: typeof BUNDLE_FORMAT;
  bundleVersion: typeof BUNDLE_VERSION;
  projectPath: typeof PROJECT_PATH;
  projectId: string;
  title: string;
  createdAt: string;
  assetPaths: string[];
  assets?: Array<{ id: string; path: string; metadata: UserAudioAssetMetadata }>;
  hummingAssets?: Array<{ id: string; path: string; mimeType: string; durationSeconds: number; recordedAt: string }>;
}

function safeFileStem(value: string): string {
  const withoutControls = [...value.normalize('NFKC')].map((character) => character.charCodeAt(0) < 32 ? '-' : character).join('');
  const normalized = withoutControls.replace(/[<>:"/\\|?*]/g, '-').replace(/[. ]+$/g, '').trim();
  return (normalized || 'patchtone-project').slice(0, 96);
}

export async function createProjectBundle(project: Project, createdAt = new Date().toISOString(), assets?: AudioAssetRepository, hummingAssets?: HummingAssetRepository): Promise<{ blob: Blob; fileName: string }> {
  const portableProject = markProjectSaved(project);
  const bundledAssets: Array<{ id: string; path: string; metadata: UserAudioAssetMetadata; data: ArrayBuffer }> = [];
  const bundledHumming: Array<{ id: string; path: string; mimeType: string; durationSeconds: number; recordedAt: string; data: ArrayBuffer }> = [];
  if (assets) {
    for (const assetId of portableProject.assetRefs) {
      const record = await assets.get(assetId);
      if (!record) continue;
      const path = `assets/${record.metadata.id}.bin`;
      bundledAssets.push({ id: record.metadata.id, path, metadata: record.metadata, data: await record.blob.arrayBuffer() });
    }
  }
  if (hummingAssets) {
    for (const take of portableProject.hummingTakes) {
      const record = await hummingAssets.get(take.assetId);
      if (!record) continue;
      bundledHumming.push({ id: record.assetId, path: `humming/${record.assetId}.bin`, mimeType: record.mimeType, durationSeconds: record.durationSeconds, recordedAt: record.recordedAt, data: await record.blob.arrayBuffer() });
    }
  }
  const manifest: ProjectBundleManifest = {
    format: BUNDLE_FORMAT,
    bundleVersion: BUNDLE_VERSION,
    projectPath: PROJECT_PATH,
    projectId: portableProject.projectId,
    title: portableProject.title,
    createdAt,
    assetPaths: [...bundledAssets.map((asset) => asset.path), ...bundledHumming.map((asset) => asset.path)],
    assets: bundledAssets.map(({ id, path, metadata }) => ({ id, path, metadata })),
    hummingAssets: bundledHumming.map(({ id, path, mimeType, durationSeconds, recordedAt }) => ({ id, path, mimeType, durationSeconds, recordedAt })),
  };
  const zip = new JSZip();
  zip.file('bundle.json', JSON.stringify(manifest, null, 2));
  zip.file(PROJECT_PATH, JSON.stringify(portableProject, null, 2));
  for (const asset of bundledAssets) zip.file(asset.path, asset.data);
  for (const asset of bundledHumming) zip.file(asset.path, asset.data);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  if (blob.size > MAX_PROJECT_BUNDLE_BYTES) throw new Error('Project file would exceed 256 MiB. Remove some audio assets and try again.');
  return { blob, fileName: `${safeFileStem(project.title)}.mctproj` };
}

function isManifest(value: unknown): value is ProjectBundleManifest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const manifest = value as Record<string, unknown>;
  return manifest.format === BUNDLE_FORMAT
    && manifest.bundleVersion === BUNDLE_VERSION
    && manifest.projectPath === PROJECT_PATH
    && typeof manifest.projectId === 'string'
    && typeof manifest.title === 'string'
    && typeof manifest.createdAt === 'string'
    && Array.isArray(manifest.assetPaths)
    && (manifest.assets === undefined || Array.isArray(manifest.assets))
    && (manifest.hummingAssets === undefined || Array.isArray(manifest.hummingAssets));
}

function isUserAudioMetadata(value: unknown): value is UserAudioAssetMetadata {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && typeof item.name === 'string'
    && (item.mimeType === 'audio/wav' || item.mimeType === 'audio/mpeg')
    && typeof item.sizeBytes === 'number' && item.sizeBytes >= 0
    && typeof item.durationSeconds === 'number' && item.durationSeconds >= 0
    && typeof item.sampleRate === 'number' && item.sampleRate > 0
    && (item.channels === 1 || item.channels === 2)
    && typeof item.sha256 === 'string'
    && item.source === 'user-upload'
    && item.licenseTag === 'user-owned-private'
    && typeof item.createdAt === 'string';
}

export async function readProjectBundle(input: ArrayBuffer | Uint8Array, assets?: AudioAssetRepository, hummingAssets?: HummingAssetRepository): Promise<Project> {
  if (input.byteLength > MAX_PROJECT_BUNDLE_BYTES) throw new Error('Project file is larger than 256 MiB.');
  const zip = await JSZip.loadAsync(input, { checkCRC32: true, createFolders: false });
  const manifestFile = zip.file('bundle.json');
  if (!manifestFile) throw new Error('Project bundle manifest is missing.');
  const manifestValue: unknown = JSON.parse(await manifestFile.async('string'));
  if (!isManifest(manifestValue)) throw new Error('Project bundle manifest is invalid or unsupported.');
  const projectFile = zip.file(manifestValue.projectPath);
  if (!projectFile) throw new Error('Project data is missing.');
  const projectValue: unknown = JSON.parse(await projectFile.async('string'));
  const project = migrateProject(projectValue);
  if (project.projectId !== manifestValue.projectId || project.title !== manifestValue.title) {
    throw new Error('Project bundle manifest does not match project data.');
  }
  if (assets && manifestValue.assets) {
    for (const entry of manifestValue.assets) {
      if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || typeof entry.path !== 'string' || !/^assets\/[A-Za-z0-9._-]+\.bin$/.test(entry.path) || !isUserAudioMetadata(entry.metadata) || entry.metadata.id !== entry.id) throw new Error('Project bundle asset manifest is invalid.');
      if (!manifestValue.assetPaths.includes(entry.path)) throw new Error('Project bundle asset path is not listed in the manifest.');
      const assetFile = zip.file(entry.path);
      if (!assetFile) throw new Error(`Project bundle asset is missing: ${entry.id}`);
      const bytes = await assetFile.async('uint8array');
      const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      await assets.save({ metadata: entry.metadata, blob: new Blob([data], { type: entry.metadata.mimeType }) });
    }
  }
  if (hummingAssets && manifestValue.hummingAssets) {
    for (const entry of manifestValue.hummingAssets) {
      if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || typeof entry.path !== 'string' || !/^humming\/[A-Za-z0-9._-]+\.bin$/.test(entry.path) || typeof entry.mimeType !== 'string' || !Number.isFinite(entry.durationSeconds) || entry.durationSeconds < 0 || typeof entry.recordedAt !== 'string') throw new Error('Project bundle humming asset manifest is invalid.');
      if (!manifestValue.assetPaths.includes(entry.path)) throw new Error('Project bundle humming asset path is not listed in the manifest.');
      const hummingFile = zip.file(entry.path);
      if (!hummingFile) throw new Error(`Project bundle humming asset is missing: ${entry.id}`);
      const bytes = await hummingFile.async('uint8array');
      const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      await hummingAssets.save({ assetId: entry.id, blob: new Blob([data], { type: entry.mimeType }), mimeType: entry.mimeType, durationSeconds: entry.durationSeconds, recordedAt: entry.recordedAt });
    }
  }
  return project;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  queueMicrotask(() => URL.revokeObjectURL(url));
}
