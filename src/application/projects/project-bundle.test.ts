import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { applyProjectCommand, createProject, createSoundChunkFromNotes, soundChunkBlocks, soundChunksFromBlocks } from '../../domain/music';
import { MemoryAudioAssetRepository } from '../audio/audio-asset-repository';
import { MemoryHummingAssetRepository } from '../humming/humming-ports';
import { createProjectBundle, readProjectBundle } from './project-bundle';

const NOW = '2026-07-22T01:00:00.000Z';

describe('project bundle', () => {
  it('round-trips a validated project through .mctproj', async () => {
    const project = createProject({ projectId: 'bundle-1', title: 'Soda / Sky', now: NOW, entryMode: 'humming-studio' });
    const result = await createProjectBundle(project, NOW);
    const restored = await readProjectBundle(await result.blob.arrayBuffer());

    expect(result.fileName).toBe('Soda - Sky.mctproj');
    expect(restored.projectId).toBe(project.projectId);
    expect(restored.savedRevision).toBe(project.revision);
    expect(restored.tracks).toHaveLength(project.tracks.length);
  });

  it('round-trips a user-saved Sound Chunk without exceeding asset ID bounds', async () => {
    const project = createProject({ projectId: 'bundle-chunk', title: 'Portable Chunk', now: NOW, entryMode: 'patchboard' });
    const chunk = createSoundChunkFromNotes('user-1', 'My シャラララン', 'arp', 'arp-silver-harp', [
      { id: 'a', pitch: 72, startTick: 960, durationTick: 240, velocity: 80, source: 'manual', confidence: null, userEdited: true, lockPitch: false, lockTiming: false },
      { id: 'b', pitch: 79, startTick: 1_440, durationTick: 480, velocity: 92, source: 'manual', confidence: null, userEdited: true, lockPitch: false, lockTiming: false },
    ]);
    const reference = project.tracks.find((track) => track.role === 'reference')!;
    const lane = reference.lanes.find((candidate) => candidate.role === 'sub')!;
    const stored = applyProjectCommand(project, { type: 'sound-chunk/save', trackId: reference.id, laneId: lane.id, blocks: soundChunkBlocks(chunk, 'stamp'), at: NOW });
    const result = await createProjectBundle(stored, NOW);
    const restored = await readProjectBundle(await result.blob.arrayBuffer());
    const restoredBlocks = restored.tracks.find((track) => track.role === 'reference')!.lanes.flatMap((candidate) => candidate.blocks);
    expect(soundChunksFromBlocks(restoredBlocks)[0]).toEqual(chunk);
    expect(restoredBlocks.every((block) => block.assetId.length <= 160)).toBe(true);
  });

  it('rejects a bundle whose manifest identity does not match the project', async () => {
    const project = createProject({ projectId: 'bundle-1', title: 'Soda Sky', now: NOW, entryMode: 'patchboard' });
    const zip = new JSZip();
    zip.file('bundle.json', JSON.stringify({ format: 'patchtone-project-bundle', bundleVersion: 1, projectPath: 'project.json', projectId: 'other', title: project.title, createdAt: NOW, assetPaths: [] }));
    zip.file('project.json', JSON.stringify(project));
    const data = await zip.generateAsync({ type: 'uint8array' });

    await expect(readProjectBundle(data)).rejects.toThrow('does not match');
  });

  it('embeds and restores user audio referenced by a project', async () => {
    const project = createProject({ projectId: 'bundle-audio', title: 'Portable Layer', now: NOW, entryMode: 'patchboard' });
    const metadata = {
      id: 'user-audio-portable', name: 'layer.wav', mimeType: 'audio/wav' as const, sizeBytes: 4,
      durationSeconds: 1, sampleRate: 44_100, channels: 1, sha256: 'a'.repeat(64), source: 'user-upload' as const,
      licenseTag: 'user-owned-private' as const, createdAt: NOW,
    };
    project.assetRefs = [metadata.id];
    const source = new MemoryAudioAssetRepository();
    await source.save({ metadata, blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: metadata.mimeType }) });
    const result = await createProjectBundle(project, NOW, source);
    const target = new MemoryAudioAssetRepository();
    const restored = await readProjectBundle(await result.blob.arrayBuffer(), target);
    expect(restored.assetRefs).toContain(metadata.id);
    const restoredAsset = await target.get(metadata.id);
    expect(restoredAsset?.metadata).toEqual(metadata);
    expect(restoredAsset?.blob).toBeInstanceOf(Blob);
    expect(new Uint8Array(await restoredAsset!.blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it('embeds and restores the raw humming take used by the melody', async () => {
    const project = createProject({ projectId: 'bundle-humming', title: 'Portable Humming', now: NOW, entryMode: 'humming-studio' });
    project.hummingTakes.push({ id: 'take-1', assetId: 'humming-1', label: 'Take 01', recordedAt: NOW, durationSeconds: .5, targetSectionId: project.arrangement.sections[0]!.id, rangeStartTick: 0, rangeEndTick: 480, status: 'ready', selected: true, transcribedNotes: [] });
    const source = new MemoryHummingAssetRepository();
    await source.save({ assetId: 'humming-1', blob: new Blob([new Uint8Array([5, 6])], { type: 'audio/wav' }), mimeType: 'audio/wav', durationSeconds: .5, recordedAt: NOW });
    const result = await createProjectBundle(project, NOW, undefined, source);
    const target = new MemoryHummingAssetRepository();
    const restored = await readProjectBundle(await result.blob.arrayBuffer(), undefined, target);
    expect(restored.hummingTakes[0]?.assetId).toBe('humming-1');
    const raw = await target.get('humming-1');
    expect(raw?.durationSeconds).toBe(.5);
    expect(new Uint8Array(await raw!.blob.arrayBuffer())).toEqual(new Uint8Array([5, 6]));
  });
});
