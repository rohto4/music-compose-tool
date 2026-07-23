(function () {
  "use strict";

  const data = window.MUSIC_COMPOSE_PROTOTYPE;
  const root = document.querySelector("#app");

  if (!root || !data) {
    throw new Error("Prototype data or #app is missing.");
  }

  const isPastel = root.dataset.design === "pastel-patchboard";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const phaseWorkspace = { draft: "assets", shape: "arrangement", detail: "melody" };
  const PPQ = 480;
  const BAR_TICKS = PPQ * 4;
  const pitchNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const snapOptions = [
    { tick: 480, label: "1/4" },
    { tick: 240, label: "1/8" },
    { tick: 120, label: "1/16" },
    { tick: 80, label: "1/16T" },
    { tick: 60, label: "1/32" },
  ];
  const starterProjects = [
    { id: "sparkle", title: "Sparkle Humming Sketch", genre: "かわいい Future Bass", phase: "30分整形", updated: "今日" },
    { id: "soda", title: "Soda Drop Study", genre: "かわいい Future Core", phase: "10分ラフ", updated: "昨日" },
    { id: "rain", title: "Pastel Rain BGM", genre: "かわいい Future Bass", phase: "60分仕上げ", updated: "7月19日" },
  ];
  const initial = {
    screen: "projects",
    newProjectOpen: false,
    activeProjectTitle: data.project.title,
    projects: clone(starterProjects),
    phase: "draft",
    workspace: "setup",
    duration: "90",
    flow: "twin-drop",
    section: "drop-a",
    arrangementSections: clone(data.arrangementAssets[0].sections),
    assetGroup: "chords",
    selectedAsset: "sky-turn",
    selectedNote: "n3",
    melody: [0, 8, 16, 32, 48, 64].flatMap((barOffset, phraseIndex) => data.melody.map((note, noteIndex) => ({
      ...clone(note),
      id: `n${phraseIndex * data.melody.length + noteIndex + 1}`,
      pitchMidi: 60 + pitchNames.indexOf(note.pitch.slice(0, -1)) + (Number(note.pitch.slice(-1)) - 4) * 12,
      tick: barOffset * BAR_TICKS + note.tick * 20,
      durationTick: note.durationTick * 20,
    }))),
    snap: 120,
    nextNoteId: 37,
    nextSectionId: 1,
    mood: data.project.mood,
    key: data.project.key,
    bpm: data.project.bpm,
    saved: false,
    humming: "idle",
    hummingRegion: { sectionId: "drop-a", startBar: 1, bars: 2 },
    ai: "home-offline",
    aiPrompt: "鼻歌の跳ねるリズムを残して、透明感のある伴奏にする",
    aiRange: "whole",
    editor: { startBar: 12, barsVisible: 16, topPitch: 84, pitchRowsVisible: 25 },
    audio: "idle",
    auditionAsset: "",
    playing: false,
    progress: 26,
  };

  let state = clone(initial);
  let history = [clone(initial)];
  let historyIndex = 0;
  let playTimer = null;
  let auditionTimer = null;
  let hummingTimers = [];
  let audioContext = null;
  let audioVoices = [];
  let canvasDrag = null;
  let arrangementDrag = null;
  let lastArrangementDragAt = 0;

  const icon = (name) => {
    const paths = {
      play: '<path d="M8 5v14l11-7z"/>',
      pause: '<path d="M7 5h4v14H7zm6 0h4v14h-4z"/>',
      undo: '<path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/>',
      redo: '<path d="m15 7 5 5-5 5"/><path d="M19 12h-8a6 6 0 0 0-6 6"/>',
      save: '<path d="M5 4h12l2 2v14H5z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>',
      mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      minus: '<path d="M5 12h14"/>',
      left: '<path d="m15 18-6-6 6-6"/>',
      right: '<path d="m9 18 6-6-6-6"/>',
      spark: '<path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4z"/><path d="m18 16 .6 2.4L21 19l-2.4.6L18 22l-.6-2.4L15 19l2.4-.6z"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      warning: '<path d="M12 3 2.8 20h18.4z"/><path d="M12 9v5M12 17h.01"/>',
      export: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/>',
      share: '<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
      chevron: '<path d="m8 10 4 4 4-4"/>',
      library: '<rect x="4" y="4" width="6" height="16" rx="1"/><rect x="14" y="4" width="6" height="16" rx="1"/>',
      timeline: '<path d="M4 6h16M4 12h10M4 18h16"/><circle cx="16" cy="12" r="2"/>',
      tune: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
      cpu: '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>',
      speaker: '<path d="M5 10v4h4l5 4V6l-5 4z"/><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
      copy: '<rect x="8" y="8" width="11" height="11" rx="1"/><path d="M5 16H4V5h11v1"/>',
      trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
    };
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
  };

  const getPhase = () => data.phases.find((item) => item.id === state.phase);
  const getFlow = () => data.arrangementAssets.find((item) => item.id === state.flow);
  const getSections = () => state.arrangementSections || getFlow()?.sections || data.sections;
  const getSection = () => getSections().find((item) => item.id === state.section) || getSections()[0];
  const getAssetGroup = () => data.assetGroups.find((item) => item.id === state.assetGroup);
  const getSelectedAsset = () => data.assetGroups.flatMap((group) => group.assets).find((item) => item.id === state.selectedAsset);
  const getAuditionAsset = () => data.assetGroups.flatMap((group) => group.assets).find((item) => item.id === state.auditionAsset) || getSelectedAsset();
  const getSelectedNote = () => state.melody.find((note) => note.id === state.selectedNote) || state.melody[0];
  const pitchFromMidi = (midi) => `${pitchNames[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
  const beatFromTick = (tick) => {
    const bar = Math.floor(tick / BAR_TICKS) + 1;
    const beat = 1 + (tick % BAR_TICKS) / PPQ;
    return `${bar}:${beat.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;
  };
  const getTotalBars = () => getSections().reduce((sum, section) => sum + section.bars, 0);
  const getSectionStartBar = (sectionId) => {
    let start = 0;
    for (const section of getSections()) {
      if (section.id === sectionId) return start;
      start += section.bars;
    }
    return 0;
  };
  const getHummingRegionStartTick = () => {
    const section = getSections().find((item) => item.id === state.hummingRegion.sectionId) || getSections()[0];
    const localBar = Math.max(1, Math.min(section.bars, state.hummingRegion.startBar));
    return (getSectionStartBar(section.id) + localBar - 1) * BAR_TICKS;
  };

  function pushHistory(nextState) {
    history = history.slice(0, historyIndex + 1);
    history.push(clone(nextState));
    historyIndex = history.length - 1;
  }

  function commit(mutator) {
    const next = clone(state);
    mutator(next);
    next.saved = false;
    state = next;
    pushHistory(next);
    render();
  }

  function undo() {
    if (historyIndex === 0) return;
    historyIndex -= 1;
    state = clone(history[historyIndex]);
    render();
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    state = clone(history[historyIndex]);
    render();
  }

  function phaseMarkup() {
    return data.phases.map((phase) => `
      <button class="phase-tab" type="button" data-action="phase" data-value="${phase.id}"
        aria-pressed="${phase.id === state.phase}">
        <span>${phase.label}</span><small>${phase.role}</small>
      </button>`).join("");
  }

  function projectControlsMarkup() {
    return `
      <section class="project-controls${isPastel ? " compact-workbench-controls" : ""}" aria-labelledby="project-settings-title">
        ${isPastel ? `
          <h1 class="sr-only">${state.activeProjectTitle} 作曲画面</h1>
          <div class="workbench-mode-row">
            <div class="compact-project-name">
              <span class="mono-label" id="project-settings-title">PROJECT</span>
              <strong>${state.activeProjectTitle}</strong>
            </div>
            <nav class="phase-nav phase-module" aria-label="制作フェーズ">${phaseMarkup()}</nav>
          </div>` : `
          <div class="project-title-block">
            <p class="mono-label" id="project-settings-title">作曲条件</p>
            <h1>${data.project.title}</h1>
            <p>${getPhase().detail}</p>
          </div>`}
        ${isPastel ? "" : `<div class="field-row">
          <label class="field compact-field">
            <span>長さ</span>
            <select data-action="duration" aria-label="曲の長さ">
              <option value="90" ${state.duration === "90" ? "selected" : ""}>90秒</option>
              <option value="60" ${state.duration === "60" ? "selected" : ""}>60秒</option>
              <option value="120" ${state.duration === "120" ? "selected" : ""}>120秒</option>
            </select>
          </label>
          <label class="field compact-field">
            <span>雰囲気</span>
            <select data-action="mood" aria-label="曲の雰囲気">
              <option ${state.mood === "前向き・きらきら" ? "selected" : ""}>前向き・きらきら</option>
              <option ${state.mood === "少し切ない" ? "selected" : ""}>少し切ない</option>
              <option ${state.mood === "元気・弾ける" ? "selected" : ""}>元気・弾ける</option>
            </select>
          </label>
          <label class="field compact-field">
            <span>キー</span>
            <select data-action="key" aria-label="曲のキー">
              <option ${state.key === "D Major" ? "selected" : ""}>D Major</option>
              <option ${state.key === "A Major" ? "selected" : ""}>A Major</option>
              <option ${state.key === "B minor" ? "selected" : ""}>B minor</option>
            </select>
          </label>
          <label class="field compact-field bpm-field">
            <span>BPM</span>
            <input data-action="bpm" type="number" min="120" max="190" value="${state.bpm}" inputmode="numeric" aria-label="BPM">
          </label>
        </div>`}
      </section>`;
  }

  function workspaceNavMarkup() {
    const workspaces = [
      { id: "setup", label: "曲の設計", icon: "tune" },
      { id: "assets", label: "音を組む", icon: "library" },
      { id: "arrangement", label: "展開を整える", icon: "timeline" },
      { id: "melody", label: "メロディ編集", icon: "tune" },
    ];
    return `
      <nav class="workspace-nav" aria-label="作曲workspace">
        ${workspaces.map((workspace) => `
          <button type="button" data-action="workspace" data-value="${workspace.id}"
            aria-pressed="${state.workspace === workspace.id}">
            ${icon(workspace.icon)}<span>${workspace.label}</span>
          </button>`).join("")}
      </nav>`;
  }

  function projectSetupMarkup() {
    return `
      <section class="project-setup panel workspace-panel" aria-labelledby="project-setup-title">
        <div class="panel-heading">
          <div><p class="mono-label">PROJECT FOUNDATION</p><h2 id="project-setup-title">曲の設計</h2></div>
          <span class="setup-state">アセット推薦と再生へ反映</span>
        </div>
        <div class="setup-grid">
          <label class="setup-field">
            <span><b>長さ</b><small>展開の数と各sectionの長さ</small></span>
            <select data-action="duration" aria-label="曲の長さ">
              <option value="60" ${state.duration === "60" ? "selected" : ""}>60秒</option>
              <option value="90" ${state.duration === "90" ? "selected" : ""}>90秒</option>
              <option value="120" ${state.duration === "120" ? "selected" : ""}>120秒</option>
            </select>
          </label>
          <label class="setup-field">
            <span><b>雰囲気</b><small>おすすめの音色と展開</small></span>
            <select data-action="mood" aria-label="曲の雰囲気">
              <option ${state.mood === "前向き・きらきら" ? "selected" : ""}>前向き・きらきら</option>
              <option ${state.mood === "少し切ない" ? "selected" : ""}>少し切ない</option>
              <option ${state.mood === "元気・弾ける" ? "selected" : ""}>元気・弾ける</option>
            </select>
          </label>
          <label class="setup-field">
            <span><b>キー</b><small>合うコード・メロディを優先</small></span>
            <select data-action="key" aria-label="曲のキー">
              <option ${state.key === "D Major" ? "selected" : ""}>D Major</option>
              <option ${state.key === "A Major" ? "selected" : ""}>A Major</option>
              <option ${state.key === "B minor" ? "selected" : ""}>B minor</option>
            </select>
          </label>
          <label class="setup-field">
            <span><b>BPM</b><small>試聴速度とtempo互換性</small></span>
            <input data-action="bpm" type="number" min="120" max="190" value="${state.bpm}" inputmode="numeric" aria-label="BPM">
          </label>
        </div>
        <div class="setup-recommendation">
          <div><span class="mono-label">RECOMMENDED START</span><strong>${state.mood === "少し切ない" ? "Story Break + Blue Room" : state.mood === "元気・弾ける" ? "Twin Drop + Candy Punch" : "Twin Drop + Sky Turn"}</strong></div>
          <p><b>${state.key}</b> · <b>${state.bpm} BPM</b>に合う音のピースを優先表示します。これらの条件は必要なAI処理にも自動で渡されます。</p>
          <button type="button" class="save-btn" data-action="workspace" data-value="assets">音を組むへ進む${icon("right")}</button>
        </div>
      </section>`;
  }

  function assetLibraryMarkup() {
    const group = getAssetGroup();
    return `
      <section class="asset-library panel workspace-panel" aria-labelledby="asset-library-title">
        <div class="panel-heading">
          <div>
            <p class="mono-label">ASSET LIBRARY</p>
            <h2 id="asset-library-title">音のピース</h2>
          </div>
          <span class="count-badge">${group.assets.length}候補</span>
        </div>
        <div class="asset-tabs" role="tablist" aria-label="音の種類">
          ${data.assetGroups.map((item) => `
            <button type="button" role="tab" class="asset-tab" data-action="asset-group" data-value="${item.id}"
              aria-selected="${item.id === state.assetGroup}">${item.label}</button>`).join("")}
        </div>
        <div class="asset-list" role="tabpanel">
          ${group.assets.map((asset) => `
            <article class="asset-piece" data-selected="${asset.id === state.selectedAsset}">
              <button type="button" class="asset-item" data-action="asset" data-value="${asset.id}"
                aria-pressed="${asset.id === state.selectedAsset}">
                <span class="asset-node" aria-hidden="true"></span>
                <span class="asset-copy"><strong>${asset.name}</strong><small>${asset.meta}</small><span>${asset.hint}</span></span>
                <span class="asset-add" aria-hidden="true">${icon(asset.id === state.selectedAsset ? "check" : "plus")}</span>
              </button>
              <button type="button" class="audition-btn" data-action="audition" data-value="${asset.id}" data-group="${group.id}"
                aria-pressed="${state.auditionAsset === asset.id}" aria-label="${asset.name}の音色を試聴">
                ${icon(state.auditionAsset === asset.id ? "pause" : "speaker")}
                <span>${state.auditionAsset === asset.id ? "試聴中" : "音色を聴く"}</span>
              </button>
            </article>`).join("")}
        </div>
      </section>`;
  }

  function sectionEditorMarkup() {
    if (state.phase === "draft") {
      return "";
    }
    const section = getSection();
    return `
      <div class="section-editor" aria-label="${section.label}の展開調整">
        <strong>${section.label}</strong>
        <label><span>長さ</span><select data-action="section-bars" aria-label="sectionの長さ">
          ${[4, 8, 16, 24].map((bars) => `<option value="${bars}" ${bars === section.bars ? "selected" : ""}>${bars} bars</option>`).join("")}
        </select></label>
        <label><span>勢い ${section.energy}</span><input type="range" min="0" max="100" step="1" value="${section.energy}" data-action="section-energy" aria-label="sectionの勢い"></label>
        <label><span>つなぎ</span><select data-action="section-transition" aria-label="sectionのつなぎ">
          ${[["fade", "自然"], ["riser", "上昇"], ["impact", "着地"], ["bloom", "広がり"], ["tape", "一度止める"]].map(([value, label]) => `<option value="${value}" ${value === section.transition ? "selected" : ""}>${label}</option>`).join("")}
        </select></label>
        <div class="section-order-actions" aria-label="sectionの順序">
          <button type="button" class="icon-btn" data-action="move-section" data-value="-1" aria-label="${section.label}を前へ">${icon("left")}</button>
          <button type="button" class="icon-btn" data-action="move-section" data-value="1" aria-label="${section.label}を後ろへ">${icon("right")}</button>
          <button type="button" class="icon-btn" data-action="delete-section" aria-label="${section.label}を削除" ${getSections().length <= 2 ? "disabled" : ""}>${icon("trash")}</button>
        </div>
      </div>`;
  }

  function arrangementMarkup() {
    const sections = getSections();
    const totalBars = sections.reduce((sum, section) => sum + section.bars, 0);
    return `
      <section class="arrangement panel workspace-panel" aria-labelledby="arrangement-title">
        <div class="panel-heading arrangement-heading">
          <div>
            <p class="mono-label">ARRANGEMENT · ${totalBars} BARS</p>
            <h2 id="arrangement-title">展開アセット</h2>
          </div>
          <label class="flow-picker">
            <span>流れを選ぶ</span>
            <select data-action="flow" aria-label="展開アセットを選ぶ" ${state.phase === "draft" ? 'disabled title="30分整形で展開アセットを交換できます"' : ""}>
              ${data.arrangementAssets.map((flow) => `
                <option value="${flow.id}" ${flow.id === state.flow ? "selected" : ""}>${flow.name}</option>`).join("")}
            </select>
          </label>
        </div>
        <p class="flow-summary"><strong>${getFlow().name}</strong> · ${getFlow().summary}</p>
        ${state.phase === "draft" ? "" : `<div class="section-template-palette" aria-label="展開テンプレートを追加">
          <span>追加</span>
          ${data.sectionTemplates.map((template) => `<button type="button" data-action="add-section" data-value="${template.id}" data-role="${template.role}">${icon("plus")}${template.label}</button>`).join("")}
        </div>`}
        <div class="section-rail" role="list" aria-label="曲のセクション">
          ${sections.map((section) => `
            <button type="button" role="listitem" class="section-segment" data-role="${section.role || "verse"}"
              data-action="section" data-drag-section="${section.id}" data-value="${section.id}" aria-pressed="${section.id === state.section}"
              title="ドラッグで順序を変更">
              <i class="drag-grip" aria-hidden="true"></i><strong>${section.label}</strong><span>${section.bars} bars</span>
            </button>`).join("")}
        </div>
        ${sectionEditorMarkup()}
        <div class="track-grid" role="table" aria-label="トラックとセクションの配置">
          ${data.tracks.map((track) => `
            <div class="track-row" role="row">
              <div class="track-label" role="rowheader"><span class="track-dot" data-track="${track.id}" aria-hidden="true"></span>${track.label}</div>
              <div class="track-blocks" role="cell">
                ${sections.map((section, index) => {
                  const block = track.blocks[index % track.blocks.length];
                  return `
                  <button type="button" class="music-block" data-action="block" data-track="${track.id}"
                    data-section="${section.id}" aria-label="${track.label}、${section.label}、${block}">
                    <span>${block}</span>
                  </button>`;
                }).join("")}
              </div>
            </div>`).join("")}
        </div>
        <div class="arrangement-caption">
          <span>現在: <strong>${getSection().label}</strong></span>
          <span>候補: <strong>${getSelectedAsset().name}</strong></span>
        </div>
      </section>`;
  }

  function melodyMarkup() {
    const selected = getSelectedNote();
    const regionStart = getHummingRegionStartTick();
    const regionEnd = regionStart + state.hummingRegion.bars * BAR_TICKS;
    const visibleMelody = state.phase === "shape"
      ? state.melody.filter((note) => note.tick + note.durationTick > regionStart && note.tick < regionEnd)
      : state.melody;
    return `
      <section class="melody-editor" aria-labelledby="melody-editor-title">
        <div class="subheading-row">
          <div>
            <p class="mono-label">PRIORITY EDIT</p>
            <h3 id="melody-editor-title">メロディの音程・リズム</h3>
          </div>
          <span class="edit-mode">${state.phase === "shape" ? "フレーズ編集" : "30分から編集"}</span>
        </div>
        <div class="note-sequence" role="listbox" aria-label="鼻歌から抽出した音符">
          ${visibleMelody.map((note, index) => `
            <button type="button" role="option" class="note-chip" data-action="note" data-value="${note.id}"
              aria-selected="${note.id === state.selectedNote}">
              <span>${note.pitch}</span><small>${note.beat}</small><i aria-hidden="true" data-height="${(index % 4) + 1}"></i>
            </button>`).join("")}
        </div>
        <div class="edit-controls" aria-label="選択した音符の編集">
          <div class="control-group">
            <span>音程</span>
            <button type="button" class="icon-btn" data-action="pitch" data-value="-1" aria-label="音程を半音下げる">${icon("minus")}</button>
            <strong>${selected.pitch}</strong>
            <button type="button" class="icon-btn" data-action="pitch" data-value="1" aria-label="音程を半音上げる">${icon("plus")}</button>
          </div>
          <div class="control-group">
            <span>タイミング</span>
            <button type="button" class="icon-btn" data-action="timing" data-value="-0.25" aria-label="音符を前へずらす">${icon("left")}</button>
            <strong>${selected.beat}</strong>
            <button type="button" class="icon-btn" data-action="timing" data-value="0.25" aria-label="音符を後ろへずらす">${icon("right")}</button>
          </div>
        </div>
      </section>`;
  }

  function detailEditorMarkup() {
    const selected = getSelectedNote();
    const snapLabel = snapOptions.find((option) => option.tick === state.snap)?.label || "1/16";
    const totalBars = getTotalBars();
    const maxStartBar = Math.max(0, totalBars - state.editor.barsVisible);
    return `
      <section class="detail-editor" aria-labelledby="detail-editor-title">
        <div class="detail-toolbar">
          <div>
            <p class="mono-label">WHOLE SONG NOTE EDITOR · ${totalBars} BARS</p>
            <h3 id="detail-editor-title">全曲の音程・リズム・強さ</h3>
          </div>
          <div class="snap-control" role="group" aria-label="グリッド幅">
            <span>グリッド</span>
            ${snapOptions.map((option) => `<button type="button" data-action="snap" data-value="${option.tick}" aria-pressed="${option.tick === state.snap}">${option.label}</button>`).join("")}
          </div>
          <div class="zoom-control" role="group" aria-label="時間軸の拡大縮小">
            <button type="button" class="icon-btn" data-action="editor-zoom" data-value="1" aria-label="時間軸を拡大">${icon("plus")}</button>
            <strong>${state.editor.barsVisible} bars表示</strong>
            <button type="button" class="icon-btn" data-action="editor-zoom" data-value="-1" aria-label="時間軸を縮小">${icon("minus")}</button>
          </div>
          <button type="button" class="quiet-btn" data-action="quantize">${snapLabel}へ揃える</button>
          <button type="button" class="quiet-btn" data-action="add-note">${icon("plus")}音符を追加</button>
        </div>
        <div class="song-overview" role="group" aria-label="全曲sectionから表示位置を選ぶ">
          ${getSections().map((section) => `<button type="button" data-action="editor-section" data-value="${section.id}" data-role="${section.role}" style="--section-flex:${section.bars}" aria-label="${section.label}から表示"><strong>${section.label}</strong><span>${section.bars}</span></button>`).join("")}
        </div>
        <label class="timeline-scroll"><span>表示位置 ${state.editor.startBar + 1}–${Math.min(totalBars, state.editor.startBar + state.editor.barsVisible)} bars</span><input type="range" min="0" max="${maxStartBar}" step="1" value="${Math.min(state.editor.startBar, maxStartBar)}" data-action="editor-scroll" aria-label="全曲内の表示位置"></label>
        <div class="piano-canvas-shell">
          <canvas class="piano-canvas" data-editor-canvas tabindex="0" role="application"
            aria-label="全${totalBars}小節のメロディ編集。表示は${state.editor.startBar + 1}から${Math.min(totalBars, state.editor.startBar + state.editor.barsVisible)}小節。ノートをドラッグして移動し、右端をドラッグして長さを変えます。">
            Canvas非対応の場合は下の音符選択と詳細ボタンで編集できます。
          </canvas>
        </div>
        <div class="note-properties" aria-label="選択中ノートの詳細編集">
          <label class="property-readout"><span>選択</span><select data-action="note-select" aria-label="編集する音符を選ぶ">${state.melody.map((note) => `<option value="${note.id}" ${note.id === state.selectedNote ? "selected" : ""}>${note.pitch} · ${beatFromTick(note.tick)}</option>`).join("")}</select></label>
          <div class="property-control"><span>音程</span><button type="button" data-action="pitch" data-value="-12">-12</button><button type="button" data-action="pitch" data-value="-1">-1</button><strong>${selected.pitch}</strong><button type="button" data-action="pitch" data-value="1">+1</button><button type="button" data-action="pitch" data-value="12">+12</button></div>
          <div class="property-control"><span>位置</span><button type="button" data-action="note-nudge" data-value="-1" aria-label="音符をグリッド1つ前へ">${icon("left")}</button><strong>${selected.tick} tick</strong><button type="button" data-action="note-nudge" data-value="1" aria-label="音符をグリッド1つ後ろへ">${icon("right")}</button></div>
          <div class="property-control"><span>長さ</span><button type="button" data-action="note-length" data-value="-1" aria-label="音符をグリッド1つ短く">${icon("minus")}</button><strong>${selected.durationTick} tick</strong><button type="button" data-action="note-length" data-value="1" aria-label="音符をグリッド1つ長く">${icon("plus")}</button></div>
          <div class="property-control"><span>強さ</span><button type="button" data-action="velocity" data-value="-8" aria-label="音の強さを下げる">${icon("minus")}</button><strong>${selected.velocity}</strong><button type="button" data-action="velocity" data-value="8" aria-label="音の強さを上げる">${icon("plus")}</button></div>
          <div class="note-actions"><button type="button" class="quiet-btn" data-action="duplicate-note">${icon("copy")}複製</button><button type="button" class="quiet-btn" data-action="delete-note" ${state.melody.length === 1 ? "disabled" : ""}>${icon("trash")}削除</button></div>
        </div>
      </section>`;
  }

  function canvasColour(name, fallback) {
    return getComputedStyle(root).getPropertyValue(name).trim() || fallback;
  }

  function getCanvasGeometry(canvas) {
    const width = Math.max(320, canvas.clientWidth || 960);
    const height = Math.max(360, canvas.clientHeight || 520);
    const left = width < 520 ? 42 : 56;
    const top = 30;
    return {
      width,
      height,
      left,
      top,
      plotWidth: width - left,
      plotHeight: height - top,
      rowHeight: (height - top) / state.editor.pitchRowsVisible,
      startTick: state.editor.startBar * BAR_TICKS,
      endTick: (state.editor.startBar + state.editor.barsVisible) * BAR_TICKS,
    };
  }

  function drawPianoCanvas() {
    const canvas = root.querySelector("[data-editor-canvas]");
    if (!canvas) return;
    const started = performance.now();
    const geometry = getCanvasGeometry(canvas);
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const backingWidth = Math.round(geometry.width * dpr);
    const backingHeight = Math.round(geometry.height * dpr);
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, geometry.width, geometry.height);

    const paper = canvasColour("--color-editor-black", "#080d13");
    const paper2 = canvasColour("--color-editor-surface", "#111a24");
    const paper3 = canvasColour("--color-editor-grid", "#243344");
    const ink = canvasColour("--color-ink", "#edf5ff");
    const muted = canvasColour("--color-muted", "#9aabc0");
    const rule = canvasColour("--color-editor-grid", "#243344");
    const ruleStrong = canvasColour("--color-editor-grid-strong", "#3d536a");
    const accent = canvasColour("--color-accent-2", "#64d5f4");
    const accentSoft = canvasColour("--color-accent-2-soft", "#173445");

    context.fillStyle = paper;
    context.fillRect(0, 0, geometry.width, geometry.height);
    context.fillStyle = paper2;
    context.fillRect(0, 0, geometry.left, geometry.height);
    context.fillRect(geometry.left, 0, geometry.plotWidth, geometry.top);

    let sectionStartBar = 0;
    getSections().forEach((section, index) => {
      const sectionStartTick = sectionStartBar * BAR_TICKS;
      const sectionEndTick = (sectionStartBar + section.bars) * BAR_TICKS;
      if (sectionEndTick > geometry.startTick && sectionStartTick < geometry.endTick) {
        const x1 = geometry.left + (Math.max(sectionStartTick, geometry.startTick) - geometry.startTick) / (geometry.endTick - geometry.startTick) * geometry.plotWidth;
        const x2 = geometry.left + (Math.min(sectionEndTick, geometry.endTick) - geometry.startTick) / (geometry.endTick - geometry.startTick) * geometry.plotWidth;
        context.fillStyle = index % 2 ? paper : paper3;
        context.globalAlpha = 0.42;
        context.fillRect(x1, geometry.top, x2 - x1, geometry.plotHeight);
        context.globalAlpha = 1;
        context.fillStyle = muted;
        context.font = "700 10px ui-monospace, monospace";
        context.fillText(section.label, x1 + 5, 19);
      }
      sectionStartBar += section.bars;
    });

    for (let row = 0; row <= state.editor.pitchRowsVisible; row += 1) {
      const y = geometry.top + row * geometry.rowHeight;
      context.strokeStyle = row % 12 === 0 ? ruleStrong : rule;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, Math.round(y) + 0.5);
      context.lineTo(geometry.width, Math.round(y) + 0.5);
      context.stroke();
      if (row < state.editor.pitchRowsVisible) {
        const pitch = state.editor.topPitch - row;
        context.fillStyle = pitch % 12 === 0 ? ink : muted;
        context.font = `${pitch % 12 === 0 ? "800" : "600"} 10px ui-monospace, monospace`;
        context.fillText(pitchFromMidi(pitch), 5, y + geometry.rowHeight * 0.66);
      }
    }

    const tickSpan = geometry.endTick - geometry.startTick;
    const minimumGridPx = 5;
    const fineStep = geometry.plotWidth * state.snap / tickSpan >= minimumGridPx ? state.snap : PPQ;
    let firstGridTick = Math.ceil(geometry.startTick / fineStep) * fineStep;
    for (let tick = firstGridTick; tick <= geometry.endTick; tick += fineStep) {
      const x = geometry.left + (tick - geometry.startTick) / tickSpan * geometry.plotWidth;
      const isBar = tick % BAR_TICKS === 0;
      const isBeat = tick % PPQ === 0;
      context.strokeStyle = isBar ? ink : isBeat ? ruleStrong : rule;
      context.lineWidth = isBar ? 1.5 : 1;
      context.beginPath();
      context.moveTo(Math.round(x) + 0.5, isBar ? 0 : geometry.top);
      context.lineTo(Math.round(x) + 0.5, geometry.height);
      context.stroke();
      if (isBar && x < geometry.width - 24) {
        context.fillStyle = ink;
        context.font = "800 10px ui-monospace, monospace";
        context.fillText(String(Math.floor(tick / BAR_TICKS) + 1), x + 4, 11);
      }
    }

    const visibleNotes = state.melody.filter((note) => note.tick + note.durationTick > geometry.startTick
      && note.tick < geometry.endTick
      && note.pitchMidi <= state.editor.topPitch
      && note.pitchMidi > state.editor.topPitch - state.editor.pitchRowsVisible);
    const noteRects = [];
    visibleNotes.forEach((note) => {
      const x1 = geometry.left + (note.tick - geometry.startTick) / tickSpan * geometry.plotWidth;
      const x2 = geometry.left + (note.tick + note.durationTick - geometry.startTick) / tickSpan * geometry.plotWidth;
      const y = geometry.top + (state.editor.topPitch - note.pitchMidi) * geometry.rowHeight + 2;
      const rect = {
        id: note.id,
        x: Math.max(geometry.left, x1),
        y,
        width: Math.max(8, Math.min(geometry.width, x2) - Math.max(geometry.left, x1)),
        height: Math.max(8, geometry.rowHeight - 4),
      };
      noteRects.push(rect);
      context.fillStyle = note.id === state.selectedNote ? accent : accentSoft;
      context.strokeStyle = ink;
      context.lineWidth = note.id === state.selectedNote ? 2 : 1;
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
      context.strokeRect(rect.x + 0.5, rect.y + 0.5, Math.max(0, rect.width - 1), Math.max(0, rect.height - 1));
      context.fillStyle = ink;
      context.fillRect(rect.x + rect.width - Math.min(6, rect.width / 2), rect.y, Math.min(6, rect.width / 2), rect.height);
      if (rect.width > 30 && rect.height > 13) {
        context.font = "800 10px ui-monospace, monospace";
        context.fillText(note.pitch, rect.x + 4, rect.y + Math.min(rect.height - 3, 13));
      }
    });

    canvas._noteRects = noteRects;
    canvas._geometry = geometry;
    canvas.dataset.visibleNotes = String(visibleNotes.length);
    canvas.dataset.totalNotes = String(state.melody.length);
    canvas.dataset.backend = "canvas-2d-main-thread";
    canvas.dataset.dpr = String(dpr);
    const selectedRect = noteRects.find((rect) => rect.id === state.selectedNote);
    if (selectedRect) {
      canvas.dataset.selectedX = selectedRect.x.toFixed(2);
      canvas.dataset.selectedY = selectedRect.y.toFixed(2);
      canvas.dataset.selectedWidth = selectedRect.width.toFixed(2);
    }
    root.dataset.canvasDrawMs = (performance.now() - started).toFixed(2);
  }

  function attachCanvasEditor() {
    const canvas = root.querySelector("[data-editor-canvas]");
    if (!canvas) return;
    drawPianoCanvas();
    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    canvas.addEventListener("pointerdown", (event) => {
      const location = point(event);
      const rect = [...(canvas._noteRects || [])].reverse().find((item) => location.x >= item.x && location.x <= item.x + item.width && location.y >= item.y && location.y <= item.y + item.height);
      if (!rect) return;
      const note = state.melody.find((item) => item.id === rect.id);
      state.selectedNote = note.id;
      canvasDrag = {
        pointerId: event.pointerId,
        noteId: note.id,
        mode: location.x >= rect.x + rect.width - 12 ? "resize" : "move",
        startX: location.x,
        startY: location.y,
        originalTick: note.tick,
        originalDuration: note.durationTick,
        originalPitch: note.pitchMidi,
        startedAt: performance.now(),
        changed: false,
      };
      canvas.setPointerCapture?.(event.pointerId);
      drawPianoCanvas();
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!canvasDrag || canvasDrag.pointerId !== event.pointerId) return;
      const location = point(event);
      const note = state.melody.find((item) => item.id === canvasDrag.noteId);
      const geometry = canvas._geometry;
      const deltaTick = Math.round(((location.x - canvasDrag.startX) / geometry.plotWidth * state.editor.barsVisible * BAR_TICKS) / state.snap) * state.snap;
      if (canvasDrag.mode === "resize") {
        note.durationTick = Math.max(state.snap, Math.min(getTotalBars() * BAR_TICKS - note.tick, canvasDrag.originalDuration + deltaTick));
      } else {
        const deltaPitch = Math.round((canvasDrag.startY - location.y) / geometry.rowHeight);
        note.tick = Math.max(0, Math.min(getTotalBars() * BAR_TICKS - note.durationTick, canvasDrag.originalTick + deltaTick));
        note.pitchMidi = Math.max(24, Math.min(108, canvasDrag.originalPitch + deltaPitch));
        note.pitch = pitchFromMidi(note.pitchMidi);
        note.beat = beatFromTick(note.tick);
      }
      canvasDrag.changed = true;
      drawPianoCanvas();
      event.preventDefault();
    });
    const finishCanvasDrag = (event) => {
      if (!canvasDrag || canvasDrag.pointerId !== event.pointerId) return;
      const drag = canvasDrag;
      canvasDrag = null;
      canvas.releasePointerCapture?.(event.pointerId);
      root.dataset.pointerInteractionMs = (performance.now() - drag.startedAt).toFixed(2);
      if (drag.changed) {
        state.saved = false;
        pushHistory(state);
      }
      render();
    };
    canvas.addEventListener("pointerup", finishCanvasDrag);
    canvas.addEventListener("pointercancel", finishCanvasDrag);
    canvas.addEventListener("dblclick", (event) => {
      const location = point(event);
      const occupied = (canvas._noteRects || []).some((item) => location.x >= item.x && location.x <= item.x + item.width && location.y >= item.y && location.y <= item.y + item.height);
      if (occupied || location.x < canvas._geometry.left || location.y < canvas._geometry.top) return;
      const geometry = canvas._geometry;
      const rawTick = geometry.startTick + (location.x - geometry.left) / geometry.plotWidth * (geometry.endTick - geometry.startTick);
      const tick = Math.max(0, Math.min(getTotalBars() * BAR_TICKS - state.snap, Math.round(rawTick / state.snap) * state.snap));
      const pitchMidi = Math.max(24, Math.min(108, state.editor.topPitch - Math.floor((location.y - geometry.top) / geometry.rowHeight)));
      commit((next) => {
        const note = { id: `n${next.nextNoteId++}`, pitch: pitchFromMidi(pitchMidi), pitchMidi, beat: beatFromTick(tick), length: "custom", tick, durationTick: next.snap, velocity: 96 };
        next.melody.push(note);
        next.selectedNote = note.id;
      });
    });
    canvas.addEventListener("keydown", (event) => {
      if (["Delete", "Backspace"].includes(event.key) && state.melody.length > 1) {
        event.preventDefault();
        commit((next) => {
          next.melody = next.melody.filter((item) => item.id !== next.selectedNote);
          next.selectedNote = next.melody[0].id;
        });
        return;
      }
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "ArrowUp") adjustPitch(1);
      if (event.key === "ArrowDown") adjustPitch(-1);
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        commit((next) => {
          const note = next.melody.find((item) => item.id === next.selectedNote);
          note.tick = Math.max(0, Math.min(getTotalBars() * BAR_TICKS - note.durationTick, note.tick + direction * next.snap));
          note.beat = beatFromTick(note.tick);
        });
      }
    });
  }

  function modelRoutesMarkup() {
    return `
      <details class="model-routes">
        <summary>${icon("cpu")}<span>使用モデル</span><small>用途ごとに自動</small>${icon("chevron")}</summary>
        <div class="model-route-list">
          ${data.modelRoutes.map((route) => `
            <div class="model-route-row">
              <span><strong>${route.capability}</strong><small>${route.mode}</small></span>
              <span><b>${route.model}</b><small>${route.state}</small></span>
            </div>`).join("")}
          <p>同じ目的のモデルを手動で選ぶ画面は置かず、capability routerが担当を決めます。</p>
        </div>
      </details>`;
  }

  function inspectorMarkup() {
    const hummingSection = getSections().find((item) => item.id === state.hummingRegion.sectionId) || getSections()[0];
    const hummingEndBar = Math.min(hummingSection.bars, state.hummingRegion.startBar + state.hummingRegion.bars - 1);
    const hummingCopy = {
      idle: ["鼻歌を取り込む", "鼻歌を音符候補へ変換します。"],
      ready: ["3 · 2 · 1", "録音を始める準備をしています。"],
      listening: ["聞き取り中…", "入力を音符候補へ変換しています。"],
      analyzing: ["音程を解析中…", "音程とリズムを編集可能な音符へ変換しています。"],
      captured: ["鼻歌を取り直す", "6音の候補を作りました。音程とタイミングを直せます。"],
    }[state.humming];
    const aiCopy = {
      "home-offline": ["Home AI オフライン", "生成済み候補と非AI編集は続けられます。"],
      loading: ["伴奏候補を準備中…", "Home AIの処理を待っています。"],
      success: ["伴奏候補を追加", "Home AI候補「Cloud Bounce」を追加しました。"],
      error: ["生成を完了できません", "既存アセットを使うか、接続後に再試行してください。"],
    }[state.ai];

    return `
      <section class="inspector panel workspace-panel" aria-labelledby="inspector-title">
        <div class="panel-heading">
          <div>
            <p class="mono-label">MELODY</p>
            <h2 id="inspector-title">メロディ編集</h2>
          </div>
          <span class="character-mark" aria-hidden="true"><i></i><i></i></span>
        </div>
        <section class="humming-panel" data-state="${state.humming}" title="${hummingCopy[1]}">
          <div class="humming-range" aria-label="鼻歌を差し込む範囲">
            <label><span>section</span><select data-action="humming-section" aria-label="鼻歌を入れるsection">${getSections().map((section) => `<option value="${section.id}" ${section.id === hummingSection.id ? "selected" : ""}>${section.label}</option>`).join("")}</select></label>
            <label><span>開始</span><input type="number" min="1" max="${hummingSection.bars}" value="${state.hummingRegion.startBar}" data-action="humming-start" inputmode="numeric" aria-label="section内の開始小節"></label>
            <label><span>長さ</span><select data-action="humming-bars" aria-label="鼻歌を入れる小節数">${[1, 2, 4, 8].map((bars) => `<option value="${bars}" ${bars === state.hummingRegion.bars ? "selected" : ""}>${bars} bars</option>`).join("")}</select></label>
          </div>
          <p class="humming-target"><strong>${hummingSection.label}</strong>の${state.hummingRegion.startBar}${hummingEndBar > state.hummingRegion.startBar ? `–${hummingEndBar}` : ""}小節へ差し込む</p>
          <button type="button" class="humming-button btn" data-action="humming" ${["ready", "listening", "analyzing"].includes(state.humming) || state.phase === "draft" ? "disabled" : ""}>
            ${["ready", "listening", "analyzing"].includes(state.humming) ? '<span class="spinner" aria-hidden="true"></span>' : icon("mic")}
            <span>${state.phase === "draft" ? "30分整形で鼻歌を追加" : hummingCopy[0]}</span>
          </button>
          <span class="sr-only" id="humming-status">${hummingCopy[1]}</span>
          <ol class="humming-steps" aria-label="鼻歌取り込みの進行">
            ${[["ready", "準備"], ["listening", "録音"], ["analyzing", "解析"], ["captured", "音符"]].map(([step, label], index, steps) => {
              const currentIndex = steps.findIndex(([id]) => id === state.humming);
              const stepState = state.humming === "idle" ? "upcoming" : index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
              return `<li data-state="${stepState}"><span>${index + 1}</span><small>${label}</small></li>`;
            }).join("")}
          </ol>
          <div class="waveform" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </section>
        ${state.phase === "detail" ? detailEditorMarkup() : melodyMarkup()}
        <section class="ai-panel" data-state="${state.ai}" aria-labelledby="ai-title">
          <div class="ai-status-line" title="${aiCopy[1]}">
            <span class="status-symbol" aria-hidden="true">${state.ai === "success" ? icon("check") : state.ai === "error" ? icon("warning") : icon("spark")}</span>
            <div><h3 id="ai-title">${aiCopy[0]}</h3><span class="sr-only">${aiCopy[1]}</span></div>
          </div>
          <div class="ai-inputs">
            <label><span>生成イメージ</span><textarea data-action="ai-prompt" rows="3" aria-label="生成イメージ">${state.aiPrompt}</textarea></label>
            <label><span>生成範囲</span><select data-action="ai-range" aria-label="生成範囲"><option value="selected" ${state.aiRange === "selected" ? "selected" : ""}>選択section</option><option value="whole" ${state.aiRange === "whole" ? "selected" : ""}>曲全体</option><option value="accompaniment" ${state.aiRange === "accompaniment" ? "selected" : ""}>伴奏だけ</option></select></label>
            <button type="button" class="quiet-btn" data-action="ai-reference">参考音を選ぶ</button>
          </div>
          <p class="ai-project-context" title="曲の設計で変更できます"><span>自動で参照</span><strong>${state.duration}秒 · ${state.mood} · ${state.key} · ${state.bpm} BPM</strong></p>
          <div class="ai-actions">
            <button type="button" class="quiet-btn" data-action="ai-generate" ${state.ai === "loading" ? "disabled" : ""}>
              ${state.ai === "loading" ? '<span class="spinner" aria-hidden="true"></span>' : "伴奏候補を作る"}
            </button>
          </div>
          ${modelRoutesMarkup()}
        </section>
      </section>`;
  }

  function stateLabMarkup() {
    return `
      <section class="state-lab" aria-labelledby="state-lab-title">
        <div>
          <p class="mono-label">INTERACTION STATES</p>
          <h2 id="state-lab-title">操作状態の見本</h2>
          <p>default、hover、focus、active、disabled、loading、error、successを同じ構造で比較します。</p>
        </div>
        <div class="state-samples">
          <button type="button" class="sample-control">通常</button>
          <button type="button" class="sample-control is-active" aria-pressed="true">選択中</button>
          <button type="button" class="sample-control" disabled>無効</button>
          <button type="button" class="sample-control is-loading" disabled><span class="spinner" aria-hidden="true"></span>処理中</button>
          <button type="button" class="sample-control is-error" aria-invalid="true">${icon("warning")}再試行</button>
          <button type="button" class="sample-control is-success">${icon("check")}追加済み</button>
        </div>
      </section>`;
  }

  function helpMarkup() {
    return `
      <details class="help-menu">
        <summary aria-label="操作ガイドを開く">?</summary>
        <div class="help-popover">
          ${stateLabMarkup()}
        </div>
      </details>`;
  }

  function projectHomeMarkup() {
    return `
      <a class="skip-link" href="#project-home">プロジェクト一覧へ移動</a>
      <header class="nav-slab project-home-header">
        <span class="slab-mark"><span class="brand-orb" aria-hidden="true"></span><span>PATCHTONE</span></span>
        <nav class="top-actions" aria-label="プロジェクト操作">${helpMarkup()}<button type="button" class="save-btn" data-action="new-project">${icon("plus")}<span>新しい曲</span></button></nav>
      </header>
      <main id="project-home" class="project-home">
        <section class="project-shelf" aria-labelledby="project-shelf-title">
          <div class="project-shelf-heading">
            <div><p class="mono-label">PROJECTS</p><h1 id="project-shelf-title">曲を選ぶ</h1></div>
            <span>${state.projects.length} projects</span>
          </div>
          ${state.newProjectOpen ? `
            <form class="new-project-panel" aria-labelledby="new-project-title">
              <div class="new-project-title"><p class="mono-label">NEW PROJECT</p><h2 id="new-project-title">新しい曲</h2></div>
              <label><span>プロジェクト名</span><input id="new-project-name" value="My Humming Sketch" autocomplete="off"></label>
              <label><span>ジャンル</span><select id="new-project-genre"><option>かわいい Future Bass</option><option>かわいい Future Core</option></select></label>
              <label><span>長さ</span><select id="new-project-duration"><option value="90">90秒</option><option value="60">60秒</option><option value="120">120秒</option></select></label>
              <label><span>雰囲気</span><select id="new-project-mood"><option>前向き・きらきら</option><option>少し切ない</option><option>元気・弾ける</option></select></label>
              <label><span>キー</span><select id="new-project-key"><option>D Major</option><option>A Major</option><option>B minor</option></select></label>
              <label><span>BPM</span><input id="new-project-bpm" type="number" min="120" max="190" value="150" inputmode="numeric"></label>
              <div class="project-start-actions">
                <button type="button" class="start-method" data-action="start-project" data-value="humming">${icon("mic")}<span><strong>鼻歌から始める</strong><small>録音から音符候補まで確認</small></span></button>
                <button type="button" class="start-method" data-action="start-project" data-value="assets">${icon("library")}<span><strong>音のピースから始める</strong><small>10分ラフの外枠から作成</small></span></button>
              </div>
            </form>` : ""}
          <div class="project-grid">
            ${state.projects.map((project) => `
              <button type="button" class="project-card" data-action="open-project" data-value="${project.id}">
                <span class="project-card-mark" aria-hidden="true"></span>
                <span><strong>${project.title}</strong><small>${project.genre}</small></span>
                <span><b>${project.phase}</b><small>${project.updated}</small></span>
              </button>`).join("")}
            <button type="button" class="project-card project-card-new" data-action="new-project">${icon("plus")}<span><strong>新しい曲</strong><small>外枠または鼻歌から開始</small></span></button>
          </div>
        </section>
      </main>
      <footer class="foot-stmt compact-footer"><span class="wordmark">PATCHTONE</span></footer>
      <div class="toast-stack" aria-live="polite" aria-atomic="true"></div>`;
  }

  function footerMarkup() {
    if (isPastel) {
      return `
        <footer class="foot-stmt compact-footer">
          <span class="wordmark">PATCHTONE</span>
        </footer>`;
    }
    return `
      <footer class="foot-stmt">
        <p class="foot-stmt__line">鼻歌の輪郭は残す。伴奏は候補から軽く選ぶ。</p>
        <div class="foot-stmt__meta">
          <span class="wordmark">PATCHTONE</span>
          <span>Phase 0 · fake data · 外部送信なし</span>
        </div>
      </footer>`;
  }

  function render() {
    const renderStarted = performance.now();
    if (isPastel && state.screen === "projects") {
      root.innerHTML = projectHomeMarkup();
      root.dataset.screen = "projects";
      root.dataset.renderMs = (performance.now() - renderStarted).toFixed(2);
      attachEvents();
      return;
    }
    root.innerHTML = `
      <a class="skip-link" href="#main-workbench">作曲画面へ移動</a>
      <header class="nav-slab">
        <button type="button" class="slab-mark" data-action="project-home" aria-label="プロジェクト一覧へ戻る">
          <span class="brand-orb" aria-hidden="true"></span><span>PATCHTONE</span>
        </button>
        ${isPastel ? "" : `<nav class="phase-nav" aria-label="制作フェーズ">${phaseMarkup()}</nav>`}
        <div class="top-actions">
          ${isPastel ? helpMarkup() : ""}
          <span class="save-state" data-saved="${state.saved}">${state.saved ? "保存済み" : "未保存"}</span>
          <button type="button" class="icon-btn" data-action="undo" aria-label="元に戻す" ${historyIndex === 0 ? "disabled" : ""}>${icon("undo")}</button>
          <button type="button" class="icon-btn" data-action="redo" aria-label="やり直す" ${historyIndex >= history.length - 1 ? "disabled" : ""}>${icon("redo")}</button>
          <button type="button" class="save-btn" data-action="save">${icon("save")}<span>保存</span></button>
        </div>
      </header>
      <main id="main-workbench">
        ${projectControlsMarkup()}
        ${isPastel ? `${workspaceNavMarkup()}<div class="workspace-stage" data-workspace="${state.workspace}">${state.workspace === "setup" ? projectSetupMarkup() : state.workspace === "assets" ? assetLibraryMarkup() : state.workspace === "arrangement" ? arrangementMarkup() : inspectorMarkup()}</div>` : `
          <div class="workbench-grid">
            ${assetLibraryMarkup()}
            ${arrangementMarkup()}
            ${inspectorMarkup()}
          </div>`}
        ${isPastel ? "" : stateLabMarkup()}
      </main>
      ${footerMarkup()}
      <div class="transport" aria-label="再生と出力">
        <button type="button" class="transport-play" data-action="play" aria-pressed="${state.playing}">
          ${icon(state.playing ? "pause" : "play")}<span>${state.playing ? "停止" : "再生"}</span>
        </button>
        <div class="transport-progress">
          <span><strong>${getSection().label}</strong> · 00:${String(Math.round(state.progress * 0.9)).padStart(2, "0")} / 01:30</span>
          <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${state.progress}"><i></i></div>
          <small class="preview-mode">${state.audio === "asset-preview" ? `${getAuditionAsset().name}の音色を試聴中` : state.audio === "synth-preview" ? "内蔵シンセでリアルタイム試聴" : state.audio === "unavailable" ? "音声を開始できません" : "再生すると内蔵シンセで試聴"}</small>
        </div>
        <div class="output-actions">
          <button type="button" class="quiet-btn" data-action="export">${icon("export")}<span>WAV書き出し</span></button>
          <details class="share-menu">
            <summary>${icon("share")}<span>共有</span>${icon("chevron")}</summary>
            <div class="share-options">
              <button type="button" data-action="share" data-value="X">X用文面</button>
              <button type="button" data-action="share" data-value="Misskey">Misskey用文面</button>
            </div>
          </details>
        </div>
      </div>
      <nav class="mobile-dock" aria-label="スマートフォン用パネル切替">
        ${isPastel ? `
          <button type="button" data-action="workspace" data-value="setup" aria-pressed="${state.workspace === "setup"}">${icon("tune")}<span>設計</span></button>
          <button type="button" data-action="workspace" data-value="assets" aria-pressed="${state.workspace === "assets"}">${icon("library")}<span>音</span></button>
          <button type="button" data-action="workspace" data-value="arrangement" aria-pressed="${state.workspace === "arrangement"}">${icon("timeline")}<span>展開</span></button>
          <button type="button" data-action="workspace" data-value="melody" aria-pressed="${state.workspace === "melody"}">${icon("tune")}<span>編集</span></button>` : `
          <button type="button" data-scroll="asset-library">${icon("library")}<span>音</span></button>
          <button type="button" data-scroll="arrangement">${icon("timeline")}<span>展開</span></button>
          <button type="button" data-scroll="inspector">${icon("tune")}<span>編集</span></button>`}
      </nav>
      <div class="toast-stack" aria-live="polite" aria-atomic="true"></div>`;

    root.style.setProperty("--progress", `${state.progress}%`);
    root.dataset.screen = "workbench";
    root.dataset.phase = state.phase;
    root.dataset.workspace = state.workspace;
    attachEvents();
    attachArrangementDrag();
    attachCanvasEditor();
    root.dataset.renderMs = (performance.now() - renderStarted).toFixed(2);
  }

  function showMessage(message, tone = "info") {
    const stack = root.querySelector(".toast-stack");
    if (!stack) return;
    const item = document.createElement("div");
    item.className = "toast";
    item.dataset.tone = tone;
    item.textContent = message;
    stack.append(item);
    window.setTimeout(() => item.remove(), 4200);
  }

  function adjustPitch(amount) {
    commit((next) => {
      const note = next.melody.find((item) => item.id === next.selectedNote);
      note.pitchMidi = Math.max(24, Math.min(108, note.pitchMidi + amount));
      note.pitch = pitchFromMidi(note.pitchMidi);
    });
  }

  function attachEvents() {
    root.querySelectorAll("[data-action]").forEach((element) => {
      const action = element.dataset.action;
      if (["mood", "key", "bpm", "duration", "flow"].includes(action)) {
        element.addEventListener("change", () => commit((next) => {
          next[action] = action === "bpm" ? Number(element.value) : element.value;
          if (action === "flow") {
            const flow = data.arrangementAssets.find((item) => item.id === element.value);
            next.arrangementSections = clone(flow.sections);
            next.section = flow.sections[0].id;
            next.hummingRegion.sectionId = flow.sections.find((section) => section.role === "drop")?.id || flow.sections[0].id;
            next.hummingRegion.startBar = 1;
          }
        }));
        return;
      }
      if (["humming-section", "humming-start", "humming-bars"].includes(action)) {
        element.addEventListener("change", () => commit((next) => {
          const property = { "humming-section": "sectionId", "humming-start": "startBar", "humming-bars": "bars" }[action];
          next.hummingRegion[property] = action === "humming-section" ? element.value : Number(element.value);
          if (action === "humming-section") next.hummingRegion.startBar = 1;
        }));
        return;
      }
      if (["ai-prompt", "ai-range"].includes(action)) {
        element.addEventListener("change", () => commit((next) => {
          next[action === "ai-prompt" ? "aiPrompt" : "aiRange"] = element.value;
        }));
        return;
      }
      if (action === "editor-scroll") {
        element.addEventListener("input", () => {
          state.editor.startBar = Number(element.value);
          drawPianoCanvas();
          const label = element.closest("label")?.querySelector("span");
          if (label) label.textContent = `表示位置 ${state.editor.startBar + 1}–${Math.min(getTotalBars(), state.editor.startBar + state.editor.barsVisible)} bars`;
        });
        element.addEventListener("change", () => {
          state.saved = false;
          pushHistory(state);
          render();
        });
        return;
      }
      if (action === "note-select") {
        element.addEventListener("change", () => commit((next) => { next.selectedNote = element.value; }));
        return;
      }
      if (["section-bars", "section-energy", "section-transition"].includes(action)) {
        element.addEventListener("change", () => commit((next) => {
          const section = next.arrangementSections.find((item) => item.id === next.section);
          const property = { "section-bars": "bars", "section-energy": "energy", "section-transition": "transition" }[action];
          section[property] = action === "section-transition" ? element.value : Number(element.value);
        }));
        return;
      }
      element.addEventListener("click", () => handleAction(action, element));
    });

    root.querySelectorAll("[data-scroll]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = root.querySelector(`.${button.dataset.scroll}`);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function attachArrangementDrag() {
    root.querySelectorAll("[data-drag-section]").forEach((segment) => {
      segment.addEventListener("pointerdown", (event) => {
        if (state.phase === "draft") return;
        arrangementDrag = { id: segment.dataset.dragSection, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
        segment.setPointerCapture?.(event.pointerId);
      });
      segment.addEventListener("pointermove", (event) => {
        if (!arrangementDrag || arrangementDrag.pointerId !== event.pointerId) return;
        if (Math.hypot(event.clientX - arrangementDrag.startX, event.clientY - arrangementDrag.startY) > 6) {
          arrangementDrag.moved = true;
          segment.dataset.dragging = "true";
        }
      });
      const finish = (event) => {
        if (!arrangementDrag || arrangementDrag.pointerId !== event.pointerId) return;
        const drag = arrangementDrag;
        arrangementDrag = null;
        segment.releasePointerCapture?.(event.pointerId);
        delete segment.dataset.dragging;
        if (!drag.moved) return;
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-drag-section]");
        if (!target || target.dataset.dragSection === drag.id) return;
        const next = clone(state);
        const fromIndex = next.arrangementSections.findIndex((item) => item.id === drag.id);
        const targetIndex = next.arrangementSections.findIndex((item) => item.id === target.dataset.dragSection);
        const [moved] = next.arrangementSections.splice(fromIndex, 1);
        next.arrangementSections.splice(targetIndex, 0, moved);
        next.section = moved.id;
        next.saved = false;
        state = next;
        pushHistory(next);
        lastArrangementDragAt = performance.now();
        render();
      };
      segment.addEventListener("pointerup", finish);
      segment.addEventListener("pointercancel", () => { arrangementDrag = null; delete segment.dataset.dragging; });
    });
  }

  function handleAction(action, element) {
    const value = element.dataset.value;
    if (action === "phase") commit((next) => { next.phase = value; next.workspace = phaseWorkspace[value]; });
    if (action === "workspace") commit((next) => { next.workspace = value; });
    if (action === "new-project") {
      state.newProjectOpen = !state.newProjectOpen;
      render();
    }
    if (action === "project-home") {
      state.screen = "projects";
      state.newProjectOpen = false;
      render();
    }
    if (action === "open-project") {
      const project = state.projects.find((item) => item.id === value);
      const phase = project.phase.startsWith("60") ? "detail" : project.phase.startsWith("30") ? "shape" : "draft";
      state.activeProjectTitle = project.title;
      state.screen = "workbench";
      state.phase = phase;
      state.workspace = phaseWorkspace[phase];
      render();
    }
    if (action === "start-project") {
      const title = root.querySelector("#new-project-name")?.value.trim() || "Untitled Humming Sketch";
      const genre = root.querySelector("#new-project-genre")?.value || data.project.genre;
      state.duration = root.querySelector("#new-project-duration")?.value || "90";
      state.mood = root.querySelector("#new-project-mood")?.value || data.project.mood;
      state.key = root.querySelector("#new-project-key")?.value || data.project.key;
      state.bpm = Number(root.querySelector("#new-project-bpm")?.value || data.project.bpm);
      state.projects.unshift({ id: `local-${state.projects.length + 1}`, title, genre, phase: value === "humming" ? "30分整形" : "10分ラフ", updated: "今" });
      state.activeProjectTitle = title;
      state.screen = "workbench";
      state.phase = value === "humming" ? "shape" : "draft";
      state.workspace = value === "humming" ? "melody" : "setup";
      state.humming = "idle";
      render();
      if (value === "humming") window.setTimeout(startFakeHumming, 180);
    }
    if (action === "section" && performance.now() - lastArrangementDragAt > 250) commit((next) => { next.section = value; });
    if (action === "add-section") commit((next) => {
      const template = data.sectionTemplates.find((item) => item.id === value);
      const section = clone(template);
      section.id = `${template.id}-custom-${next.nextSectionId++}`;
      section.label = `${template.label} ${next.arrangementSections.filter((item) => item.role === template.role).length + 1}`;
      const selectedIndex = next.arrangementSections.findIndex((item) => item.id === next.section);
      next.arrangementSections.splice(selectedIndex + 1, 0, section);
      next.section = section.id;
    });
    if (action === "move-section") commit((next) => {
      const index = next.arrangementSections.findIndex((item) => item.id === next.section);
      const target = Math.max(0, Math.min(next.arrangementSections.length - 1, index + Number(value)));
      if (target === index) return;
      const [section] = next.arrangementSections.splice(index, 1);
      next.arrangementSections.splice(target, 0, section);
    });
    if (action === "delete-section") commit((next) => {
      const index = next.arrangementSections.findIndex((item) => item.id === next.section);
      next.arrangementSections.splice(index, 1);
      next.section = next.arrangementSections[Math.max(0, index - 1)].id;
    });
    if (action === "asset-group") commit((next) => {
      next.assetGroup = value;
      next.selectedAsset = data.assetGroups.find((group) => group.id === value).assets[0].id;
    });
    if (action === "asset") commit((next) => { next.selectedAsset = value; });
    if (action === "audition") playAssetPreview(element.dataset.group, value);
    if (action === "note") commit((next) => { next.selectedNote = value; });
    if (action === "pitch") adjustPitch(Number(value));
    if (action === "timing") commit((next) => {
      const note = next.melody.find((item) => item.id === next.selectedNote);
      note.tick = Math.max(0, Math.min(getTotalBars() * BAR_TICKS - note.durationTick, note.tick + Number(value) * PPQ));
      note.beat = beatFromTick(note.tick);
    });
    if (action === "snap") commit((next) => { next.snap = Number(value); });
    if (action === "note-nudge") commit((next) => {
      const note = next.melody.find((item) => item.id === next.selectedNote);
      note.tick = Math.max(0, Math.min(getTotalBars() * BAR_TICKS - note.durationTick, note.tick + Number(value) * next.snap));
      note.beat = beatFromTick(note.tick);
    });
    if (action === "note-length") commit((next) => {
      const note = next.melody.find((item) => item.id === next.selectedNote);
      note.durationTick = Math.max(next.snap, Math.min(getTotalBars() * BAR_TICKS - note.tick, note.durationTick + Number(value) * next.snap));
    });
    if (action === "velocity") commit((next) => {
      const note = next.melody.find((item) => item.id === next.selectedNote);
      note.velocity = Math.max(1, Math.min(127, note.velocity + Number(value)));
    });
    if (action === "quantize") commit((next) => {
      next.melody.forEach((note) => {
        note.tick = Math.max(0, Math.min(getTotalBars() * BAR_TICKS - note.durationTick, Math.round(note.tick / next.snap) * next.snap));
        note.beat = beatFromTick(note.tick);
      });
    });
    if (action === "duplicate-note") commit((next) => {
      const source = next.melody.find((item) => item.id === next.selectedNote);
      const duplicate = clone(source);
      duplicate.id = `n${next.nextNoteId++}`;
      duplicate.tick = Math.min(getTotalBars() * BAR_TICKS - duplicate.durationTick, source.tick + next.snap);
      duplicate.beat = beatFromTick(duplicate.tick);
      next.melody.push(duplicate);
      next.selectedNote = duplicate.id;
    });
    if (action === "add-note") commit((next) => {
      const source = next.melody.find((item) => item.id === next.selectedNote);
      const note = { id: `n${next.nextNoteId++}`, pitch: source.pitch, pitchMidi: source.pitchMidi, beat: "1", length: "1/4", tick: next.editor.startBar * BAR_TICKS, durationTick: next.snap, velocity: 96 };
      const occupied = new Set(next.melody.map((item) => item.tick));
      while (occupied.has(note.tick) && note.tick < getTotalBars() * BAR_TICKS - note.durationTick) note.tick += next.snap;
      note.beat = beatFromTick(note.tick);
      next.melody.push(note);
      next.selectedNote = note.id;
    });
    if (action === "delete-note") commit((next) => {
      next.melody = next.melody.filter((item) => item.id !== next.selectedNote);
      next.selectedNote = next.melody[0].id;
    });
    if (action === "editor-zoom") commit((next) => {
      const levels = [4, 8, 16, 32, 64];
      const index = levels.indexOf(next.editor.barsVisible);
      next.editor.barsVisible = levels[Math.max(0, Math.min(levels.length - 1, index - Number(value)))];
      next.editor.startBar = Math.min(next.editor.startBar, Math.max(0, getTotalBars() - next.editor.barsVisible));
    });
    if (action === "editor-section") commit((next) => {
      next.editor.startBar = Math.min(getSectionStartBar(value), Math.max(0, getTotalBars() - next.editor.barsVisible));
      const startTick = next.editor.startBar * BAR_TICKS;
      const endTick = (next.editor.startBar + next.editor.barsVisible) * BAR_TICKS;
      const firstVisible = next.melody.find((note) => note.tick + note.durationTick > startTick && note.tick < endTick);
      if (firstVisible) next.selectedNote = firstVisible.id;
    });
    if (action === "undo") undo();
    if (action === "redo") redo();
    if (action === "save") {
      state.saved = true;
      history[historyIndex] = clone(state);
      render();
    }
    if (action === "block") commit((next) => { next.section = element.dataset.section; });
    if (action === "export") showMessage("WAV書き出しは実装段階で接続します。", "info");
    if (action === "share") showMessage(`${value}向け共有文面を作りました。`, "success");
    if (action === "play") togglePlay();
    if (action === "humming") startFakeHumming();
    if (action === "ai-generate") startFakeGeneration();
    if (action === "ai-reference") showMessage("参考音は実装時にlocal file選択へ接続します。", "info");
    if (action === "ai-error") {
      state.ai = "error";
      render();
    }
  }

  function startFakeHumming() {
    hummingTimers.forEach((timer) => window.clearTimeout(timer));
    hummingTimers = [];
    state.humming = "ready";
    render();
    hummingTimers.push(window.setTimeout(() => {
      state.humming = "listening";
      render();
    }, 650));
    hummingTimers.push(window.setTimeout(() => {
      state.humming = "analyzing";
      render();
    }, 1850));
    hummingTimers.push(window.setTimeout(() => {
      state.humming = "captured";
      applyHummingCapture();
      render();
    }, 2800));
  }

  function applyHummingCapture() {
    const startTick = getHummingRegionStartTick();
    const endTick = startTick + state.hummingRegion.bars * BAR_TICKS;
    state.melody = state.melody.filter((note) => note.origin !== "humming" || note.tick < startTick || note.tick >= endTick);
    const phrase = data.melody.map((source, index) => {
      const pitchMidi = 60 + pitchNames.indexOf(source.pitch.slice(0, -1)) + (Number(source.pitch.slice(-1)) - 4) * 12;
      const tick = Math.min(endTick - state.snap, startTick + source.tick * 20);
      return {
        ...clone(source),
        id: `n${state.nextNoteId++}`,
        pitchMidi,
        tick,
        durationTick: Math.min(source.durationTick * 20, endTick - tick),
        beat: beatFromTick(tick),
        origin: "humming",
        phraseIndex: index,
      };
    });
    state.melody.push(...phrase);
    state.selectedNote = phrase[0].id;
    state.editor.startBar = Math.min(Math.floor(startTick / BAR_TICKS), Math.max(0, getTotalBars() - state.editor.barsVisible));
    state.saved = false;
  }

  function startFakeGeneration() {
    state.ai = "loading";
    render();
    window.setTimeout(() => {
      state.ai = "success";
      render();
    }, 900);
  }

  function stopPreviewVoices() {
    audioVoices.forEach((voice) => {
      try { voice.stop(); } catch { /* voice already ended */ }
    });
    audioVoices = [];
  }

  async function ensureAudioContext() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return false;
    try {
      audioContext ||= new AudioContextConstructor({ latencyHint: "interactive" });
      if (audioContext.state === "suspended") await audioContext.resume();
      return audioContext.state === "running";
    } catch {
      return false;
    }
  }

  function scheduleTone(frequency, offset, duration, type = "triangle", peak = 0.022, endFrequency = null) {
    if (!audioContext || audioContext.state !== "running") return;
    const start = audioContext.currentTime + offset;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.025, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.onended = () => {
      audioVoices = audioVoices.filter((voice) => voice !== oscillator);
      gain.disconnect();
    };
    audioVoices.push(oscillator);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  async function playAssetPreview(groupId, assetId) {
    const started = await ensureAudioContext();
    if (!started) {
      state.audio = "unavailable";
      render();
      showMessage("このbrowserでは音色を試聴できません。", "info");
      return;
    }
    stopPreviewVoices();
    if (auditionTimer) window.clearTimeout(auditionTimer);
    const variation = (assetId.length % 3) * 1.035;
    const melody = [293.66, 369.99, 440, 587.33].map((frequency) => frequency * variation);
    if (["drums", "percussion"].includes(groupId)) {
      [0, 0.38, 0.76, 1.14].forEach((offset, index) => {
        scheduleTone(index % 2 ? 180 : 105, offset, 0.16, index % 2 ? "square" : "sine", 0.025, index % 2 ? 90 : 46);
        if (index % 2) scheduleTone(1100, offset + 0.02, 0.055, "square", 0.008, 580);
      });
    } else if (["fx", "transition"].includes(groupId)) {
      scheduleTone(groupId === "fx" ? 180 : 120, 0, 1.45, "sine", 0.018, groupId === "fx" ? 1500 : 880);
      scheduleTone(720, 1.18, 0.24, "triangle", 0.012, 260);
    } else if (groupId === "bass") {
      [0, 0.34, 0.68, 1.02].forEach((offset, index) => scheduleTone([73.42, 92.5, 110, 92.5][index] * variation, offset, 0.28, "sawtooth", 0.018));
    } else if (["chords", "pad"].includes(groupId)) {
      [[1, 1.25, 1.5], [1.12, 1.4, 1.68]].forEach((chord, chordIndex) => chord.forEach((ratio, voiceIndex) => {
        scheduleTone(220 * variation * ratio, chordIndex * 0.68 + voiceIndex * 0.025, groupId === "pad" ? 0.72 : 0.52, voiceIndex === 0 ? "triangle" : "sine", 0.011);
      }));
    } else {
      melody.forEach((frequency, index) => scheduleTone(frequency, index * (groupId === "arp" ? 0.19 : 0.3), groupId === "arp" ? 0.18 : 0.27, groupId === "synth" ? "square" : "triangle", 0.017));
    }
    state.audio = "asset-preview";
    state.auditionAsset = assetId;
    render();
    auditionTimer = window.setTimeout(() => {
      if (state.auditionAsset === assetId) {
        state.auditionAsset = "";
        if (!state.playing) state.audio = "idle";
        render();
      }
    }, 1750);
  }

  function schedulePreviewStep() {
    if (!audioContext || audioContext.state !== "running") return;
    const context = audioContext;
    const now = context.currentTime;
    const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 440, 369.99];
    const rootFrequency = scale[state.progress % scale.length];
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.022, now + 0.018);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    master.connect(context.destination);

    [rootFrequency, rootFrequency * 1.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index === 0 ? -4 : 4, now);
      oscillator.connect(master);
      oscillator.onended = () => {
        audioVoices = audioVoices.filter((voice) => voice !== oscillator);
        if (audioVoices.length === 0) master.disconnect();
      };
      audioVoices.push(oscillator);
      oscillator.start(now);
      oscillator.stop(now + 0.36);
    });
  }

  async function startPreviewAudio() {
    try {
      if (!await ensureAudioContext()) return false;
      schedulePreviewStep();
      return audioContext.state === "running";
    } catch {
      return false;
    }
  }

  async function togglePlay() {
    if (state.playing) {
      state.playing = false;
      state.audio = "idle";
      stopPreviewVoices();
      if (playTimer) {
        window.clearInterval(playTimer);
        playTimer = null;
      }
      render();
      return;
    }

    state.playing = true;
    const audioStarted = await startPreviewAudio();
    state.audio = audioStarted ? "synth-preview" : "unavailable";
    playTimer = window.setInterval(() => {
      state.progress = state.progress >= 100 ? 0 : state.progress + 1;
      if (audioStarted) schedulePreviewStep();
      updateTransport();
    }, 450);
    render();
    if (!audioStarted) {
      showMessage("このbrowserでは音声を開始できません。タイムラインだけ再生します。", "info");
    }
  }

  function updateTransport() {
    const bar = root.querySelector(".progress-track");
    const time = root.querySelector(".transport-progress > span");
    if (bar) {
      bar.setAttribute("aria-valuenow", String(state.progress));
      root.style.setProperty("--progress", `${state.progress}%`);
    }
    if (time) time.innerHTML = `<strong>${getSection().label}</strong> · 00:${String(Math.round(state.progress * 0.9)).padStart(2, "0")} / 01:30`;
  }

  render();
})();
