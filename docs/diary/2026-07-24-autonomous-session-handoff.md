# 2026-07-24 autonomous session handoff

## 1. 復帰点

- branch: `main`
- browser QA・正本同期のverified commit: `6313ac2ab0517147c5c6c0f87e55d4479963baa1`
- `origin/main`: 上記hashとの一致を`git ls-remote origin refs/heads/main`で確認済み
- このhandoff自体は上記commit後のdocs-only follow-up

再開時は会話要約ではなく、`AGENTS.md`に従って次を実体から読む。

1. `AGENTS.md`
2. `PROJECT.md`
3. `tech-stack.md`
4. `README.md`
5. `docs/imp/user-tasks.md`
6. `docs/guide/implementation-context-reading-guide.md`
7. `docs/imp/imp-tasks.md`
8. `docs/imp/user-judge.md`
9. `docs/imp/imp-comp.md`
10. このhandoff

## 2. このsessionで閉じたunit

### HOME-003 / START-002のlocal slice

- 保存Projectの再生／停止、先頭、±30秒、任意位置previewを実装・確認した。
- 別曲切替、終了、unmountで前のsourceを停止する。
- 6 starterをProjectへ適用する前に、一時Projectとして試聴できる。
- 新規作成は次の3経路を順序付きで表示する。
  1. `パッチボードで組む`
  2. `AIで土台を作る → 鼻歌でメロディを追加する`
  3. `鼻歌をもとに曲を作る`
- 未選択時はfieldを隠し、選択後だけroute別fieldとsubmit labelを展開する。
- Project読込は現時点で`.mctproj専用`と表示する。
- 375pxで新規作成detailsのsubmitがclipされる問題と、長いProject名がdocumentを5px横へ広げる問題をCSSで修正した。

主な証跡:

- `docs/imp/evidence/project-home-route-mobile-2026-07-24.png`
- `docs/imp/evidence/project-home-preview-wqhd-2026-07-24.png`
- `docs/imp/evidence/project-home-preview-mobile-2026-07-24.png`

### SHORTCUT-002

- canonical値を変えず、表示だけ`Ctrl + S`、`Shift + ↑`形式へ統一した。
- default、変更済み、未設定、conflict、browser予約errorで同じformatterを使う。
- `キーを入力…`中の同button再clickとEscapeでcaptureを中止する。
- localStorage schemaと既存command matchingは変更していない。

### FLOW-002

- 旧`ラフ制作 / カスタマイズ`二重切替を次の3 tabへ一本化した。
  1. `01 曲の設計`
  2. `02 展開を整える`
  3. `03 詳細の編集`
- 01は設計indicator、Mood 1 / 2、Key、Tempo、曲の流れを持つ。
- 02は選択PHRASEとコード譜を共有INSERT TARGETとして上部へ固定する。
- INSERT SOURCEだけを`コード・音色 / コードセット / 伴奏 / FX・Fill / 音色割当`の5 tabで切り替える。
- 4 / 8 STEPは8分音符の左右矢印で長さを変え、AUTOが残り拍を吸収する。
- 伴奏候補は対象section、Mood、現在コード進行、コード音色を決定論的にscoreし、上位2件と一致理由を表示する。
- 旧Arrangement専用tabは表示せず、01末尾のcompactな曲の流れから同じsection commandを扱う。

主な証跡:

- `docs/imp/evidence/flow-recommendations-wqhd-2026-07-24.png`
- `docs/imp/evidence/autonomous-quality-mobile-2026-07-24.png`

### DAW-012 / DAW-013

- 03を上部transport / tool、timeline、piano roll、track、下部Mixerへ整理した。
- MIDI接続状態、音符inspector、Sound Chunk棚、選択statusをpiano rollより上の常設面から外した。
- ruler pointer / keyboard、縦playhead、先頭・section seek、停止位置保持を追加した。
- `AudioEngine.playProject(project, startTick)`は開始前eventをskipし、開始位置をまたぐnote / audio clipを残り時間だけ鳴らす。
- WQHD 2560×1440の最初のviewportでpiano rollが320px以上見えることをChromiumで固定した。
- 任意の`?` guideとEscape closeを保持する。初回強制tourにはしていない。

主な証跡:

- `docs/imp/evidence/daw-first-viewport-wqhd-2026-07-24.png`
- `docs/imp/evidence/customize-piano-roll-375-dark-2026-07-23.png`

### INTEROP-001

- 完全保存は`.mctproj`。
- 現在のStudio One handoffはStandard MIDI Type 1、master WAV、track stems。
- native `.song`は第三者向け公開schemaを確認できないため推測parserを作らない。
- `.dawproject`は公開specを持つ将来候補として、最小export → importの順に別unitで検討する。
- plugin state、Sound Set、media、EULA、実Studio One importは外部gateとして分離した。

正本:

- `docs/research/studio-one-interoperability-2026-07-24.md`

## 3. 検証結果

### 全project check

`npm.cmd run check`:

- ESLint warning 0
- typecheck pass
- Vitest 33 files / 146 tests pass
- home AI gateway smoke pass
- production build pass
- Phase 1 progress 16 units / weight 100
- feature matrix 44 rows / 102 local links

jsdomはCanvas package未導入のため`HTMLCanvasElement.getContext()` warningを出すがtestはpassする。Viteのlarge chunk warningは既知で、今回の機能failureではない。

### 実browser

- URL: `http://127.0.0.1:4173/`
- Chromium FHD project
- 15 / 15 journey pass、単一run 5.2分
- 主なviewport: 2560×1440、1920×1080、1648×944、1440×900、768×1024、375×812
- console error 0
- page error 0
- request failure 0
- document横overflow 0

journeyは3経路、3段navigation、5 source tab、共有target、46コード、伴奏推薦、click / drag、save / reload、Project Home preview、shortcut表示・capture中止、playhead、88鍵、Mixer、WAV / stems / MIDIを含む。

`npm.cmd run test:dark`:

- 1440 / 768 / 375 Homeと1440 editor
- overflow 0
- console / request failure 0

`npm.cmd run test:pwa`:

- manifest
- service worker
- controller
- cache
- app registration

Accessibilityはsemantic role、accessible name、unnamed button 0、keyboard journeyを確認した。axe等による完全なWCAG監査ではない。

## 4. 残る実装順

### 1. START-002の残り / AI-FOUNDATION-002

Project Homeの3経路と段階表示は閉じた。次は第2経路のAI土台画面を深くする。

- Mood、Key、BPM、section flow、主音色、コード傾向、伴奏密度から具体的promptを決定論的に構成する。
- 送信前にinstrumental-only promptとstructured requestを確認・copyできる。
- local rule / fakeでもChord、Bass、Drum、Pad、Arpを別laneへ生成する。
- provider unavailable、malformed、partial trackをtestする。
- 外部AI送信、secret、home server job、課金は別承認なしに行わない。

### 2. HARMONY-001

46 qualityの実装と主な自動proofは存在するが、現行taskは完了扱いにしていない。次sessionでは受入条件を再照合する。

- Major / Minorでdeterminismと重複なし
- Power、aug、dim7、half-dim7、9、11、13
- quality固有intervalがpad、HOLD / PULSE / SYNC、配置、全曲再生、MIDIで一致
- 長いsymbolのWQHD / mobile崩れ
- 既存pad ID / progression互換

条件を満たしたら`imp-tasks.md`から外し、`imp-comp.md`へ実証を移す。未確認を推測で完了扱いにしない。

### 3. ASSET-004

Bass / Lead / Synth / Pad / Arp / Percussionを各20へ増強する。

- 名称差だけで増やさず、layer、waveform、ADSR、filter、stereo、characterを変える。
- 外部sample、license未確認WAV、依存追加は行わない。
- 既存asset IDとProject互換を維持する。

### 4. 継続品質

- `DES-006`の冗長文削減と制作面積改善
- 実耳で6 phrase kit、42 role pattern、60 tonal、46 chord、24 Sound Chunkをレビュー
- 完全なaccessibility auditは必要になった時に別unit化
- PlaywrightがWindowsで自前webServer停止時に長く残る場合、手動Viteを先に起動する回避を使う。機能failureとは混同しない

## 5. ユーザー／外部gate

次は自動checkで完了扱いにしない。

- 実speaker / headphoneでの音色、伴奏、click / pop、mix品質
- 実Studio OneへのMIDI / WAV / stems import
- 実MIDI機器permission / latency
- smartphone実機のChord Pad sustainとPWA install prompt
- X / Misskey実投稿
- ACE-Step実生成品質
- Sound Set、commercial plug-in、user-owned contentのEULA
- UI / 操作／音楽品質の★4判断

## 6. rebuild判断

今回の完成度向上では、既存の`frontend-design`と`browser-qa`の規律を使い、現行正本を維持したまま必要なCSS、journey、証跡を閉じられた。丸ごと作り直した代替版は作っていない。3段navigation、共有target、piano-roll firstの現行案が全15 journeyとresponsive proofを通っているため、現時点では現行案を継続する方がよい。

