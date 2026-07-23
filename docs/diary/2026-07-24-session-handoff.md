# 2026-07-24 session handoff

## 1. このhandoffの目的

長いユーザーレビューで増えた要件を、次sessionで会話履歴へ依存せず再開できる状態にする。現在のprimary完成線は`パッチボードで組む`であり、これまでの指摘を閉じた後に`AIで土台を作る → 鼻歌を追加`、最後に`鼻歌をもとに曲を作る`へ進む。

このfileは進行状態の補助である。再開時は必ず`AGENTS.md`記載順で正本を先に読み、`docs/imp/imp-tasks.md`の現行本文を優先する。

## 2. 採用済みの開始経路と優先順位

新規曲は次の3経路として示す。単に3機能を横並びにした意味構造へ戻さない。

1. `パッチボードで組む`
   - 現在のprimary implementation。
   - コード、音色、伴奏、FX、4小節phrase、全曲構造、試聴、詳細編集を先に磨く。
2. `AIで土台を作る → 鼻歌でメロディを追加する`
   - Patchboardが閉じた後の第2フェーズ。
   - Mood、Key、BPM、曲の流れ、主音色、伴奏密度等の選択から具体的なinstrumental promptを内部生成し、送信内容を確認可能にする。
   - flat audioではなくChord / Bass / Drum / Pad / Arp等の編集可能なlaneを作る。
3. `鼻歌をもとに曲を作る`
   - 第3フェーズ。低優先度だが経路は残す。
   - 鼻歌を曲全体置換ではなくmelody seedとして共通Projectへ合流させる。

入口を選ぶ前は下のfieldを表示しない。選択後に必要fieldだけを縦へ滑らかに展開する。Patchboard / AIは曲名、genre、Mood、Key、BPM等を扱い、鼻歌先行は録音前に不要なKey / BPM入力を強制しない。

この判断は`PROJECT.md`と`START-002` / `AI-FOUNDATION-002`へ同期済み。

## 3. このsessionで実装済みの途中unit

### 3.1 DAWのpiano-roll first化と途中位置再生

主なfile:

- `src/domain/audio/types.ts`
- `src/domain/audio/audio-plan.ts`
- `src/adapters/audio/web-audio-engine.ts`
- `src/features/projects/WorkspaceShell.tsx`
- `src/features/melody/DawMelodyEditor.tsx`
- `src/features/melody/DawMelodyEditor.test.tsx`
- `src/domain/audio/audio-plan.test.ts`
- `src/styles.css`

実装済み:

- `AudioEngine.playProject(project, startTick?)`へ拡張した。
- start tickより前のnote / audio clipをskipし、playheadをまたぐeventは残り部分だけへclipする。
- DAW ruler click / keyboardでplayheadを移動し、選んだ位置から全Projectを再生する。
- 先頭へ戻す、縦playhead、sectionからのseekを追加した。
- MIDI未接続、音符inspector、Sound Chunk棚、選択status等をpiano roll前の常設面から外した。
- 上部transport / compact tool、中央timeline + piano roll、track切替、下部mixerへ整理した。
- `?`から任意のspotlight guideを開ける。通常面へ説明文を常設しない。
- `frontend-design`の規律を使い、generic card列ではなく、全幅のdark pastel DAWとして中央楽譜を主役にした。

残り:

- `src/styles.css`の旧`.note-inspector` / `.sound-chunk-shelf`等の不要なresponsive ruleを整理する。
- WQHD 2560×1440の最初のviewportでpiano rollが常に見えることを実browser screenshotで確認する。
- ユーザーはguided helpの追加作り込みを後回しでよいと明示した。通常編集と見た目の崩れ修正を優先する。

### 3.2 Project Homeのpreview playerと開始経路

主なfile:

- `src/features/projects/ProjectHome.tsx`
- `src/App.tsx`
- `src/App.test.tsx`

実装済み:

- 保存Project cardへ共通`AudioEngine.playProject(project, startTick)`を使うpreview stateを追加した。
- 先頭、30秒戻る、再生／停止、30秒進む、任意位置range、現在時間／全長を追加した。
- 新規曲の入口をPatchboard、AI + Humming、Humming firstの順に変更した。
- Patchboardをdraftの既定値にしたが、画面上は入口をclickするまでfieldを表示しない。
- AI / PatchboardはMood、Key、BPMを表示し、Humming firstでは曲名とgenreだけを先行表示する。
- `App.test.tsx`を入口選択後にfieldが現れるjourneyへ更新した。

未完:

- `.project-preview-*`と`.new-project-details`のCSSは未実装。機能DOMはあるがproduction品質の見た目ではない。
- Project Home preview専用testがない。別曲切替、seek、30秒換算、終了、unmount stopを追加する。
- starter曲の適用前試聴は未実装。`SongStarterBrowser`へ`AudioEngine`を渡し、一時Projectを永続化せず鳴らす。
- browser screenshot / audio smokeは未実施。

### 3.3 task・恒久方針の同期

`docs/imp/imp-tasks.md`へ次を追加した。

- `START-002`: 3つの開始経路と段階表示
- `AI-FOUNDATION-002`: 選択値から具体的なAI prompt / symbolic foundation
- `INTEROP-001`: Studio One交換境界
- `SHORTCUT-002`: shortcut表示とcapture解除

`PROJECT.md`へPatchboard → AI foundation → Humming firstの実装順を同期した。

## 4. ショートカットの最新ユーザー指摘

次sessionで`SHORTCUT-002`を小さな独立unitとして実装する。

- 内部canonical valueの`ArrowUp`等は変えない。
- 設定画面だけ`↑`、`↓`、`←`、`→`で表示する。
- `Ctrl+S`ではなく`Ctrl + S`、`Shift + ↑`のように`+`前後へ半角spaceを置く。
- error / conflictにも同じdisplay formatterを使う。
- `キーを入力…`中の同じbuttonを再clickしたらcaptureを中止する。
- Escape中止、解除、初期値、保存、localStorage互換を壊さない。

対象:

- `src/application/shortcuts/shortcut-registry.ts`
- `src/features/settings/ShortcutSettingsModal.tsx`
- `src/features/settings/ShortcutSettingsModal.test.tsx`

## 5. Studio One互換性の調査結果と次の扱い

結論:

- Studio One native `.song`の直接importを最初の互換線にしない。公開された安定parserがなく、Studio One version、media、plugin state等への依存を安全に再現できない。
- 現行の完全保存は`.mctproj`。
- 現行のStudio One handoffはStandard MIDI Type 1とWAV / stems。
- 将来のProject交換候補はopenな`.dawproject`。note、audio、tempo、marker、mixer等の共通部分を段階実装し、unsupported plugin / featureは警告で可視化する。

次sessionでは次の一次資料をresearch documentへまとめる。

- Studio One MIDI FAQ: https://support.presonus.com/hc/en-us/articles/360004944692-Studio-One-MIDI-FAQ
- DAWproject introduction: https://support.presonus.com/hc/en-us/articles/19743606863629-Introducing-DAW-Project
- Save / interchange options: https://support.presonus.com/hc/en-us/articles/360044744812-Studio-One-5-Exploring-the-Save-Options
- Stems: https://support.presonus.com/hc/en-us/articles/210044093-Studio-One-Is-there-an-easy-way-to-export-stems-in-S1

`Projectを読み込む`は現時点で`.mctproj`専用だとUI上も明示する。`.dawproject`実装はresearchとscope確定後の別unitとする。

## 6. 最大4時間の推奨実行順

時間は目安であり、検証failureを隠して次へ進まない。

### 0:00–0:20 復帰とbaseline

1. `AGENTS.md`の順で正本を読む。
2. このhandoffを読む。
3. `git status --short`でユーザー差分を把握し、reset / checkoutしない。
4. 次を実行する。

```powershell
npm.cmd run typecheck -- --pretty false
npm.cmd run test -- src/domain/audio/audio-plan.test.ts src/features/melody/DawMelodyEditor.test.tsx src/features/settings/ShortcutSettingsModal.test.tsx src/App.test.tsx
```

baselineは2026-07-24時点でtypecheck pass、上記4 files / 35 tests pass。

### 0:20–1:15 HOME-003 / START-002の途中差分を閉じる

1. Project Home playerと入口段階表示のCSSを実装する。
2. Project Home previewのcomponent testを追加する。
3. starter曲の`聴く / 停止`を適用前に実装する。
4. `.mctproj専用`の読み込みcopyを明示する。
5. desktop / smartphoneで入口選択前後とplayerを確認する。

### 1:15–1:45 SHORTCUT-002

1. canonical shortcutとdisplay formatterを分離する。
2. 矢印glyph、space付き` + `、error / conflict表示を統一する。
3. 同button再clickとEscapeでcaptureを中止する。
4. component / registry testを追加する。

### 1:45–2:45 DAW-012 / DAW-013の実browser仕上げ

1. 旧CSS selectorを整理する。
2. WQHD 2560×1440でfirst viewportを撮る。
3. piano roll、transport、playhead、track switcher、mixerのoverflow / overlapを直す。
4. 任意tickから再生、停止、先頭、section seek、選択音だけ試聴を操作確認する。
5. guided helpの文章追加は後回し。通常面の密度と楽譜面積を優先する。

### 2:45–3:25 Patchboardの残量を一つだけ深く閉じる

次の順で、途中unitを一つ選んでtestまで閉じる。複数を中途半端に増やさない。

1. `FLOW-002`: 02の共有INSERT TARGET + INSERT SOURCE tabと4小節保持
2. `HARMONY-001`: 46 qualityの表示崩れ・即時発音・配置・MIDI一致
3. `ASSET-004`: Bass / Lead / Synth / Pad / Arp / Percussion各20の不足分

音色は名称だけで水増しせず、oscillator、ADSR、filter、stereo、用途を変える。license未確認WAVは追加しない。

### 3:25–4:00 調査・全回帰・正本同期

1. `docs/research/studio-one-interoperability-2026-07-24.md`を作る。
2. 変更範囲のtest後、可能なら`npm.cmd run check`を実行する。
3. ChromiumでWQHDとsmartphoneのscreenshotを確認する。
4. 完了unitを`imp-tasks.md`から外し、結果を`imp-comp.md`へ移す。
5. `phase1-feature-progress-matrix`を更新する。ユーザー確認前に★4へ上げない。
6. 未完、external gate、browser未確認を明記してhandoffを更新する。

## 7. 禁止・停止線

- ユーザーの既存変更を削除、reset、checkoutしない。
- Patchboard途中でAI / microphoneを主作業へ切り替えない。
- 外部AI送信、実microphone、secret、課金、Cloudflare、deploy、commit、pushを別承認なしに行わない。
- license未確認sample / loop / font / imageをproductionへ同梱しない。
- `.song`互換、Studio One完全互換、実音源品質を未検証で謳わない。
- test passを実耳、実speaker、WQHD browser確認の代替にしない。

## 8. 2026-07-24終了時の自動確認

- `npm.cmd run typecheck -- --pretty false`: pass
- 関連Vitest:
  - `src/domain/audio/audio-plan.test.ts`
  - `src/features/melody/DawMelodyEditor.test.tsx`
  - `src/features/settings/ShortcutSettingsModal.test.tsx`
  - `src/App.test.tsx`
  - 4 files / 35 tests: pass
- jsdomはCanvas packageなしのため`HTMLCanvasElement.getContext()` warningを出すが、上記test自体はpass。
- full `npm.cmd run check`、browser screenshot、Project Home playerの実音確認は未実施。

