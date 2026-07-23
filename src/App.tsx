import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { browserProjectRepository } from './adapters/storage/indexeddb-project-repository';
import { browserAudioEngine } from './adapters/audio/web-audio-engine';
import { audioBlobDuration, basicPitchTranscriber } from './adapters/humming/basic-pitch-transcriber';
import { browserMicrophoneRecorder } from './adapters/humming/browser-microphone-recorder';
import { browserHummingAssetRepository } from './adapters/storage/indexeddb-humming-asset-repository';
import { browserAudioAssetRepository } from './adapters/storage/indexeddb-audio-asset-repository';
import type { ProjectRepository } from './application/projects/project-repository';
import type { HummingAssetRepository, HummingTranscriber, MicrophoneRecorder } from './application/humming/humming-ports';
import type { AudioEngine } from './domain/audio';
import { createProjectBundle, downloadBlob, readProjectBundle } from './application/projects/project-bundle';
import { createAiStarterFoundation, createProject, createProjectHistory, executeProjectCommand, isProjectDirty, markProjectSaved, redoProject, undoProject } from './domain/music';
import type { EntryMode, Project, ProjectHistory } from './domain/music';
import { ProjectHome } from './features/projects/ProjectHome';
import type { NewProjectDraft } from './features/projects/ProjectHome';
import { WorkspaceShell } from './features/projects/WorkspaceShell';
import { ShortcutSettingsModal } from './features/settings/ShortcutSettingsModal';
import { commandForShortcut, emitShortcutCommand, isTextEditingTarget, loadShortcutBindings, saveShortcutBindings, shortcutFromKeyboardEvent } from './application/shortcuts/shortcut-registry';
import type { ShortcutBindings } from './application/shortcuts/shortcut-registry';

interface AppProps {
  repository?: ProjectRepository;
  audioEngine?: AudioEngine;
  microphoneRecorder?: MicrophoneRecorder;
  hummingTranscriber?: HummingTranscriber;
  hummingAssetRepository?: HummingAssetRepository;
  inspectHummingDuration?: (blob: Blob) => Promise<number>;
  now?: () => string;
  createId?: () => string;
  createHummingId?: () => string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type ColorTheme = 'dark-pastel' | 'vanilla-pastel' | 'friendly-signal';
const COLOR_THEME_KEY = 'patchtone-color-theme-v1';
const COLOR_THEMES: ReadonlyArray<{ id: ColorTheme; label: string }> = [
  { id: 'dark-pastel', label: 'Dark Studio' },
  { id: 'vanilla-pastel', label: 'Vanilla Pastel' },
  { id: 'friendly-signal', label: 'Friendly Signal' },
];

function storedColorTheme(): ColorTheme {
  try {
    const stored = localStorage.getItem(COLOR_THEME_KEY);
    return COLOR_THEMES.some((theme) => theme.id === stored) ? stored as ColorTheme : 'dark-pastel';
  } catch {
    return 'dark-pastel';
  }
}

const defaultDraft: NewProjectDraft = {
  title: '',
  startMode: 'patchboard',
  genre: 'cute-future-bass',
  mood: '前向き、きらきら',
  targetDurationSeconds: 90,
  key: 'D major',
  bpm: 150,
};

function defaultProjectTitle(projectCount: number): string {
  return `新しい曲 ${projectCount + 1}`;
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function App({ repository = browserProjectRepository, audioEngine = browserAudioEngine, microphoneRecorder = browserMicrophoneRecorder, hummingTranscriber = basicPitchTranscriber, hummingAssetRepository = browserHummingAssetRepository, inspectHummingDuration = audioBlobDuration, now = () => new Date().toISOString(), createId = randomId, createHummingId = randomId }: AppProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectHistory, setProjectHistory] = useState<ProjectHistory | null>(null);
  const [surface, setSurface] = useState<EntryMode>('patchboard');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(defaultDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(storedColorTheme);
  const [shortcutSettingsOpen, setShortcutSettingsOpen] = useState(false);
  const [shortcutBindings, setShortcutBindings] = useState<ShortcutBindings>(loadShortcutBindings);

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
    document.documentElement.style.colorScheme = colorTheme === 'vanilla-pastel' ? 'light' : 'dark';
    try { localStorage.setItem(COLOR_THEME_KEY, colorTheme); } catch { /* storage can be unavailable in private contexts */ }
  }, [colorTheme]);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    setInstallPrompt(null);
    await prompt.prompt();
    await prompt.userChoice;
  };

  const refreshProjects = useCallback(async () => setProjects(await repository.list()), [repository]);

  useEffect(() => {
    let active = true;
    void repository.list().then((items) => {
      if (active) setProjects(items);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Projectの読み込みに失敗しました。');
    });
    return () => { active = false; };
  }, [repository]);

  useEffect(() => {
    if (!projectHistory || !isProjectDirty(projectHistory.present)) return;
    const preventClose = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventClose);
    return () => window.removeEventListener('beforeunload', preventClose);
  }, [projectHistory]);

  const openProject = (project: Project, nextSurface: EntryMode) => {
    setProjectHistory(createProjectHistory(project));
    setSurface(nextSurface);
    setMessage(null);
    setError(null);
  };

  const setCreatingPanel = (value: boolean) => {
    setCreating(value);
    if (value) {
      setDraft((current) => current.title.trim()
        ? current
        : { ...current, title: defaultProjectTitle(projects.length) });
    }
  };

  const createNewProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const timestamp = now();
    const entryMode: EntryMode = draft.startMode === 'humming-studio' ? 'humming-studio' : 'patchboard';
    const baseProject = createProject({
      projectId: createId(),
      title: draft.title.trim(),
      now: timestamp,
      entryMode,
      genre: draft.genre,
      mood: draft.mood.split(/[、,]/).map((item) => item.trim()).filter(Boolean),
      targetDurationSeconds: draft.targetDurationSeconds,
      bpm: draft.bpm,
      key: draft.key,
    });
    const project = draft.startMode === 'ai-starter' ? createAiStarterFoundation(baseProject, timestamp) : baseProject;
    openProject(project, entryMode);
    setCreating(false);
    setDraft(defaultDraft);
  };

  const saveCurrentProject = useCallback(async () => {
    if (!projectHistory) return;
    setBusy(true);
    setError(null);
    try {
      const saved = markProjectSaved(projectHistory.present);
      await repository.save(saved);
      setProjectHistory({ ...projectHistory, present: saved });
      await refreshProjects();
      setMessage('Projectをこのbrowserへ保存しました。');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Projectの保存に失敗しました。');
    } finally {
      setBusy(false);
    }
  }, [projectHistory, refreshProjects, repository]);

  const exportProject = useCallback(async (project: Project) => {
    setBusy(true);
    setError(null);
    try {
      const bundle = await createProjectBundle(project, now(), browserAudioAssetRepository, browserHummingAssetRepository);
      downloadBlob(bundle.blob, bundle.fileName);
      setMessage(`${bundle.fileName} を書き出しました。`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Project fileの書き出しに失敗しました。');
    } finally {
      setBusy(false);
    }
  }, [now]);

  const importProject = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      if (!file.name.toLowerCase().endsWith('.mctproj')) throw new Error('`.mctproj` fileを選んでください。');
      const imported = markProjectSaved(await readProjectBundle(await file.arrayBuffer(), browserAudioAssetRepository, browserHummingAssetRepository));
      await repository.save(imported);
      await refreshProjects();
      setMessage(`${imported.title} を読み込みました。`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Project fileの読み込みに失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const applyCommand = (command: Parameters<typeof executeProjectCommand>[1]) => {
    setProjectHistory((current) => current ? executeProjectCommand(current, command) : current);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (shortcutSettingsOpen) return;
      const shortcut = shortcutFromKeyboardEvent(event);
      if (!shortcut) return;
      const commandId = commandForShortcut(shortcutBindings, shortcut);
      if (!commandId) return;
      if (isTextEditingTarget(event.target) && commandId !== 'project.save') return;
      if (event.repeat && ['settings.open', 'project.save', 'project.export', 'edit.undo', 'edit.redo', 'transport.play-toggle'].includes(commandId)) return;
      if (commandId === 'settings.open') {
        event.preventDefault();
        setShortcutSettingsOpen(true);
        return;
      }
      if (!projectHistory) return;
      event.preventDefault();
      if (commandId === 'project.save') { void saveCurrentProject(); return; }
      if (commandId === 'project.export') { void exportProject(projectHistory.present); return; }
      if (commandId === 'edit.undo') { setProjectHistory((current) => current ? undoProject(current, now()) : current); return; }
      if (commandId === 'edit.redo') { setProjectHistory((current) => current ? redoProject(current, now()) : current); return; }
      emitShortcutCommand(commandId);
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [exportProject, now, projectHistory, saveCurrentProject, shortcutBindings, shortcutSettingsOpen]);

  const updateShortcutBindings = (next: ShortcutBindings) => {
    try {
      saveShortcutBindings(next);
      setShortcutBindings(next);
      setShortcutSettingsOpen(false);
      setMessage('ショートカット設定をこの端末へ保存しました。');
    } catch {
      setError('ショートカット設定を保存できませんでした。');
    }
  };

  const notices = useMemo(() => (
    <div className="app-notices" aria-live="polite">
      {message && <div className="notice notice-success">{message}<button type="button" onClick={() => setMessage(null)} aria-label="通知を閉じる">×</button></div>}
      {error && <div className="notice notice-error">{error}<button type="button" onClick={() => setError(null)} aria-label="エラーを閉じる">×</button></div>}
    </div>
  ), [error, message]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => setProjectHistory(null)} aria-label="Patchtone project home">
          <span className="brand-mark" aria-hidden="true" />
          <span>PATCHTONE</span>
        </button>
        <div className="header-actions">
          <button className="settings-link" type="button" onClick={() => setShortcutSettingsOpen(true)}>設定</button>
          <label className="theme-picker"><span>THEME</span><select aria-label="カラーテーマ" value={colorTheme} onChange={(event) => setColorTheme(event.target.value as ColorTheme)}>{COLOR_THEMES.map((theme) => <option value={theme.id} key={theme.id}>{theme.label}</option>)}</select></label>
          <div className="header-status" role="status"><span className="status-dot" aria-hidden="true" />Local only</div>
          {installPrompt && <button className="button" type="button" onClick={() => void installApp()}>アプリとして追加</button>}
        </div>
      </header>
      {notices}
      {projectHistory ? (
        <WorkspaceShell
          project={projectHistory.present}
          surface={surface}
          dirty={isProjectDirty(projectHistory.present)}
          busy={busy}
          audioEngine={audioEngine}
          microphoneRecorder={microphoneRecorder}
          hummingTranscriber={hummingTranscriber}
          hummingAssetRepository={hummingAssetRepository}
          inspectHummingDuration={inspectHummingDuration}
          createHummingId={createHummingId}
          now={now}
          onHome={() => setProjectHistory(null)}
          onSave={() => void saveCurrentProject()}
          onExport={() => void exportProject(projectHistory.present)}
          onSwitchSurface={setSurface}
          onCommand={applyCommand}
          canUndo={projectHistory.past.length > 0}
          canRedo={projectHistory.future.length > 0}
          onUndo={() => setProjectHistory((current) => current ? undoProject(current, now()) : current)}
          onRedo={() => setProjectHistory((current) => current ? redoProject(current, now()) : current)}
        />
      ) : (
        <ProjectHome
          projects={projects}
          audioEngine={audioEngine}
          creating={creating}
          draft={draft}
          busy={busy}
          onCreatingChange={setCreatingPanel}
          onDraftChange={setDraft}
          onCreate={createNewProject}
          onOpen={openProject}
          onExport={(project) => void exportProject(project)}
          onImport={(file) => void importProject(file)}
        />
      )}
      {shortcutSettingsOpen && <ShortcutSettingsModal open bindings={shortcutBindings} onClose={() => setShortcutSettingsOpen(false)} onSave={updateShortcutBindings} />}
    </div>
  );
}
