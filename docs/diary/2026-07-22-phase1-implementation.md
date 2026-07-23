# 2026-07-22 Phase 1 implementation diary

## Session objective

Pastel Patchboardを実際に音楽を作れるlocal Web / PWAへ昇格し、明朝までに新規project、音、伴奏、note edit、manual save、master WAVの最短経路を通す。

## Operating loop

各unitを次の順で閉じる。

1. implementation
2. narrow test / build / browser observation
3. `docs/imp/phase1-progress.md`とHTMLのstatus同期
4. `docs/imp/imp-comp.md`へ完成証拠
5. diaryへ観測と次unit
6. knowledge-vaultへ再利用可能な記録または`skip`理由

## Entries

### PIVOT-001: Harmonic Atlas / 31-voice Chord Deck / Dark Pastel

- Outcome: Chord Padを9音色から31 tonal音色へ拡張し、6 family Voice Deck、全14候補を同時表示するHarmonic Atlas、各1〜4拍の4 / 8 STEP進行へ再設計した。P / H surface切替は左上の丸い2 controlへ縮小した。
- Design: `Overview without hiding`、`State in the frame`、`Shape carries meaning`、`Compact, not tiny`、`One tap to sound`、`Progressive precision`の6原則を画面全体へ適用した。純黒を避け、blue-violet / lavender / blue-greenのDark Pastel面へ更新した。60分DAWは最暗面のまま保持した。
- Proof: Vitest 20 files / 79 tests、Chromium FHD E2E 10/10、dark QA 4面、PWA runtime、matrix 26 rows / 58 links。Full HDでChord Pad下端921px、Atlas下端887px、horizontal overflow 0。375pxもdocument overflow 0。
- Review boundary: technical pathはAI確認済み★3。31音色の実耳、コード関係図の分かりやすさ、1〜4拍の操作感、Dark Pastelの柔らかさはユーザーの★4判断待ち。
- Next: Bass / Arp / Drumのrole追従1小節pattern browser。既存AI Starter、Humming、60分DAW、Project / MIDI互換性を維持する。

### PLAN-001: Phase 1 blueprint and star chart

- Outcome: 16 construction units、weight 100、明朝demo critical path、外部gateを定義した。
- Artifacts: `docs/imp/phase1-blueprint.md`、`docs/imp/phase1-progress.md`、`docs/imp/phase1-progress.html`。
- Proof: `node scripts/validate_phase1_progress.mjs`は16 unit、weight 100、HTML同期true。Chrome 1920x1080 screenshotで重なりと横切れなし。
- User acceptance: 星取り表は基本的に問題なし。整理完了後の実装再開を許可。
- Next: `P1-FND` production scaffold。

### SCOPE-001: Humming Studioを別production surfaceへ追加

- Answer: Project Homeに「鼻歌から一曲」と「パッチボードで組む」の2入口を置く。
- Boundary: Humming Studioはrecord、intent、transcription、伴奏 / 展開 / FX生成、候補比較、自然言語refine、Patchboard handoffを一つのflowにする。
- Reuse: Project / Track / Lane / Audio Engine / DAW editorは二重実装しない。
- Progress impact: `P1-INT`を3から6へ増やし、P1-DAW / PWA / QAのweightを調整して合計100を維持した。

### P1-FND: production scaffold

- Outcome: exact dependency、strict TypeScript、lint、unit test、build、manifest、browser smokeを備えたproduction entrypointを作った。
- Proof: `npm run check` pass、Vitest 1/1、Playwright 1/1、HTTP 200、console error 0、audit 0 vulnerability。
- Failure / recovery: `defineConfig`をViteからimportしてVitestの`test` fieldが型外になった。`vitest/config`へ変更した。typed ESLintをconfig fileへ広く適用して失敗したためTS sourceへ限定した。Playwright video用FFmpeg未導入はvideoを不要と判断してoffにした。
- Runtime: hidden local dev serverを`127.0.0.1:4173`で継続起動。
- Vault: session recordへ完了を追記し、tooling boundaryのtransferable patternを`knowledge/dev/`へ記録する。
- Next: `P1-DOM`。

### P1-DOM: production music domain / schema

- Outcome: `1.0.0` Project / Track / main-sub Lane / Note / Automation / Humming Take / Generation Candidate contract、factory、commands、undo / redo、manual-save revision、Phase 0 migrationを実装した。
- Proof: `npm run check` pass、Vitest 7/7、schema JSON parse、production build、progress validator pass。
- Failure / recovery: PPQ / version literalの不一致branchがTypeScript上`never`となるlint errorを固定messageで解消した。Vitestが`tests/e2e`を誤収集したため、unit includeを`src/**/*.test.{ts,tsx}`へ限定した。
- Product effect: Humming StudioとPatchboard Workbenchが共有する編集可能なsymbolic Project正本ができた。全instrumentがmain / sub laneを持ち、BridgeとBreakを別roleで保持する。
- Vault: session recordへverified証拠を追記する。domain設計はPJ固有のため、現時点で独立knowledge noteは作らない。
- Next: `P1-PRJ`。Project Home、2つの開始入口、IndexedDB manual save、project import / exportを実装する。

### P1-PRJ: Project Home / manual save / project bundle

- Outcome: Project Home、鼻歌 / Patchboardの二入口、曲条件form、保存Project shelf、IndexedDB manual save、dirty close warning、`.mctproj` export / importを実装した。
- Proof: `npm run check` pass、Vitest 11/11、Full HD Playwright journey 1/1、reload persistence、download / import、console error 0。375pxはhorizontal overflow 0。
- Visual observation: Pastel Patchboardの直線的なframe、限定した角丸、track以外のneutral surfaceを継承した。Humming Studioは別pageで録音を第一actionにした。undefined color tokenによりmeter / selected色が消えていたため、token正本に存在するaccent / lavender / blueへ修正した。
- Save boundary: 新規Projectは未保存で開始し、Save clickだけでIndexedDBへ置く。`.mctproj` downloadはbrowser保存状態を暗黙に変更しない。
- Vault: session recordへverified証拠を追記する。IndexedDB / JSZipの選択自体は一般的で、現時点では独立knowledge noteを増やさない。
- Next: `P1-AUD`。built-in synth / drum / FX、asset 1-tap audition、timeline scheduling、WAV / MP3 importを接続する。

### P1-AUD: realtime audio / asset import

- Outcome: pure audio event plan、Web Audio scheduler、10 built-in asset、1-tap phrase、Project transport、WAV / MP3 private libraryを実装した。
- Proof: `npm run check` pass、Vitest 16/16、Full HD Chrome audition / actual WAV decode / Project playback / reload E2E 1/1、console error 0。10 cards、horizontal overflow 0。
- Ownership: Projectにhumming noteがあればそのpitch / timingをleadへ使用し、ない場合だけdeterministic melody patternを補う。flat audioは生成していない。
- Asset boundary: import時のuser actionだけでaudio Blobを`patchtone-audio-assets`へ保存する。128MiB / 10分 / stereo以下、magic bytes、decode、SHA-256を検査し、licenseは`user-owned-private`固定で推測しない。
- Vault: session recordへverified証拠を追記する。Web Audio / file validationの再利用知識はexport / failure test後にまとめるため、現unitでは独立noteを作らない。
- Next: `P1-ARR`。section template、add / remove / pointer drag / keyboard reorder、block配置、main / sub lane操作を実装する。

### P1-ARR: arrangement / block / main-sub lane

- Outcome: section template / edit / delete / drag / button reorder、Main / Sub lane matrix、section-bound block配置、global undo / redoを実装した。
- Proof: `npm run check` pass、Vitest 17/17、Full HD Chrome Bridge add / undo / redo / drag event / keyboard button / Main-Sub block journey 1/1、console warning 0。1920px overflow 0。
- Data behavior: section normalize後に`parentBlockId`を持つblockのtick / durationを再計算し、section削除時のorphanを除去する。UIでstandard外の14 barsが2 barsに見える問題を目視で発見し、current optionを動的に足した。
- Visual: section roleはleft frameの形 / 線種 / 太さで表現し、色はtrack lane / blockへ使った。active workspace titleを「曲の設計」固定から各role名へ変更した。
- Vault: session recordへverified証拠を追記する。drag / keyboard二重操作は既存Project要件であり、新規knowledge noteは作らない。
- Next: `P1-HAR`。melody noteを固定入力とし、chord / bass / drum / synth / pad / arpの編集可能伴奏をsectionへ生成する。

### P1-HAR: melody-preserving editable accompaniment

- Outcome: melody pitch classを優先するdiatonic harmonizer、16-note fallback starter、6 editable accompaniment track、atomic regeneration、Project audio playbackを実装した。
- Proof: `npm run check` pass、Vitest 20/20、Full HD Chrome starter → 16 notes → 6 tracks → play / save / reload E2E 1/1、console error 0、1920px overflow 0。
- Ownership: melody notesとlockは生成前後でdeep equal。既存manual notesを残しgenerated notesだけを書き換える。Candidateへ`melody:pitch-locked` / `melody:timing-locked` traceを保存する。
- UI: Humming Studioのstep表示はmelody / intent / accompanimentの実stateへ追従し、生成後は「ニュアンスを整える」へ進む。
- Vault: session recordへverified証拠を追記する。harmonizerはPJのgenre / data contractへ密結合するため、独立knowledge noteは作らない。
- Next: `P1-MIC`。実microphoneで30秒take、retake / compare、Basic Pitch note候補を作り、template melodyと差し替える。

### P1-MIC: real microphone / Basic Pitch transcription

- Outcome: 最大30秒の実microphone録音、手動停止、録音file import、private raw take保存、複数takeの試聴比較、同梱Basic Pitchによる音符化、Melody採用take切替を実装した。
- Proof: `npm run check` pass、Vitest 10 files / 26 tests、Playwright 3/3。Chrome fake microphoneでpermission / stop / take保存、3.2秒4音WAVを実modelで約6.4秒で音符化しMelodyへ適用した。
- Failure / recovery: Browser decode後のAudioBufferが44.1kHzとなりBasic Pitchの22.05kHz入力契約で失敗した。解析用AudioContextへ`sampleRate: 22050`を明示し、同じ実model E2Eをpassさせた。
- Data behavior: raw audioは`patchtone-humming-takes`へ保存し、Projectにはasset ID、range、status、transcribed note、selected take、model provenanceを保持する。pitch / rhythmはlockし、伴奏側が追従する。
- Vault: session recordへ実model証拠とsample-rate failureを追記する。22.05kHz契約はpackage固有のため独立knowledge noteは作らない。
- Next: `P1-INT`。文章、mood、spoken memo、reference audio、自然言語refine、生成候補比較、Patchboard handoffをHumming Studioへ接続する。
## 2026-07-22 追加実装: DAW・AI gateway・export

ユーザー回答の「鼻歌の音程・リズムは維持し、周辺をAI/テンプレートで作る」「main/sub lane」「WAV・MIDI・project保存」「10GiB VRAM hard cap」を実装正本へ反映した。Pastel Patchboardの60分仕上げにCanvasピアノロールを接続し、Canvasはviewportに必要なgridとnoteだけ描画する設計にした。音量・パン・mute・soloはAudioPlanにも反映した。

ローカルAIは`127.0.0.1:17321`の非同期gatewayを経由する。GPUモデルはfull-track jobで明示設定された場合だけロードし、ACE-Step DiT-onlyの実測7,504MiBをallowlist、10,240MiBを超えるmetricsは失敗扱いにする。伴奏は編集可能symbolic fallbackを必ず持ち、gateway停止時もブラウザ内Template Harmonizerへ戻る。

検証はlint、typecheck、Vitest 11 files / 29 tests、gateway smoke、Playwrightの作曲・マイク・Basic Pitch journeyを実行した。未検証の実ACE artifact、実MIDI機器、SNS actual post、PWA installは進捗表でactive/externalとして保留し、local作業の停止要因にはしない。

## 2026-07-22 追加実装: intent・portable audio bundle・FX runtime・browser QA

- Humming Studioへ文章指示、mood chip、参考音声 / ボイスメモimportを追加し、`project/intent` / `project/intent-media` commandで履歴・保存へ接続した。
- AI flat audioはreference trackのadditional audio clipとして扱い、鼻歌のsymbolic melodyを正本に残した。`.mctproj`へuser-owned audio metadataとbinaryを同梱し、import時にAudioAssetRepositoryへ復元するround-trip testを追加した。
- Canvas DAWのFX / automation値をWeb Audio再生とOfflineAudioContext WAV renderへ反映。FX planの補間とbundle復元をVitestで検証した。
- ACE-Step gatewayへ実設定を一時的に渡し、DiT-only 10秒 full-trackをRTX 5080で生成。artifact HTTP 200、48kHz stereo、peak reserved 7,500MiBを確認後、gateway processを停止した。1.7B LM 14,128MiB経路は引き続き禁止。
- Playwright 6/6（Chromium FHD。WAV / STEMS / MIDIの実download envelopeを含む）とBrowser QA（1440 / 768 / 375px、overflow 0、console/network failure 0）をpass。スクリーンショットは`docs/imp/evidence/`へ保存した。
- 進捗星取り表をP1-DAW / P1-MIX / P1-AI / P1-EXP verified、P1-PWA / P1-QA activeへ更新。verified行のweightを再計算し、scoreは81/100へ整合させた。Knowledge vaultへ再利用パターンと作業記録を同期した。

### P1-EXP / P1-MIDI / P1-SHR: export parser・MIDI note-off・credential-free share

- `src/application/audio/exports.ts`へStandard MIDIのlane name / tempo meta、channel割当、同tickのnote-off先行、空lane対応を追加した。`parseMidiFile`はMIDI note-on / note-off（velocity 0を含む）からdurationTickを復元し、running status・meta・sysex・truncated inputを検査する。
- 同fileへ`parseWavHeader`（RIFF/WAVE fmt/data chunkとduration）と`parseStemBundle`（JSZip manifest、master / 全stemのWAV envelope、manifest/file count）を追加した。STEMSの同名trackはファイル名suffixで衝突を避ける。
- `src/features/melody/DawMelodyEditor.tsx`のWeb MIDI adapterはinput/channel/pitchごとにactive noteを保持し、note-offまたはvelocity 0で実経過tickを`note/update.durationTick`へ確定する。複数同音入力、再接続時のhandler置換、unmount時cleanupを含む。未接続・非対応時は従来どおりUIへ状態を出す。
- `src/application/share/share-intent.ts`へMisskey root URL正規化、http(s)以外のshare URL除去、`buildCredentialFreeShareIntent`を追加した。tokenを保持・送信せず、X / Misskey actual postはexternal gateのまま。
- `src/application/audio/exports.test.ts`へMIDI duration、PCM WAV、STEMS ZIP、malformed fixtureを追加し、`src/application/share/share-intent.test.ts`へroot/path/query/unsafe URL境界を追加した。
- Proof: `npm.cmd run lint` pass、`npm.cmd run typecheck -- --pretty false` pass、Vitest 14 files / 41 tests pass（担当追加分はMIDI fake deviceを含む8 tests）。実MIDI機器、実SNS資格情報によるpost、browser downloadの実機確認は未実施であり、進捗星取り表のactive / external gateへ残す。
- Progress sync: `P1-SHR`を`pending`から`active`へ移し、local credential-free intent adapterのfixture証拠と、actual post用credential gateを分離した。`npm.cmd run validate:progress`は16 units / weight 100 / HTML同期true。

## 2026-07-22 継続実装: intent反映・Misskey投稿・PWA/MIDI証跡

- `intent-refinement.ts`をdomain barrelへ公開し、文章・moodからsparkle / soft / drivingを推定。ローカルharmonizer、browser gateway request、fallback gatewayのintentTraceへ同じvariantを渡すようにした。
- Humming Studioの音声入力を「ボイスメモ指示」と「参考音声」に分離し、`spokenIntentAssetId`と`referenceAssetIds`へ別々に保存。Project bundleのuser audio同梱経路をそのまま利用する。
- `postMisskeyNote`を追加し、明示クリック後に一時tokenをMisskey `/api/notes/create`へ送る。tokenは保存・返却・ログ出力せず、fake HTTP unitとChromium journeyで成功・空token・不正応答を検証した。XはOAuth境界のためintent URLを継続する。
- 10分ラフでは展開編集を固定し、30分整形からArrangement Editorを開く段階差を明示した。既存foundation E2Eを段階遷移に同期した。
- Web MIDI fake inputからnote-on/offを送り、DAWでduration確定・選択状態まで確認した。実MIDI機器はexternal gateのまま。
- `scripts/qa_pwa.mjs`を追加し、production previewのmanifest、standalone、scope、service worker registration、shell cacheをChromiumで確認した。`npm.cmd run test:pwa`はpass。
- 最新証跡はVitest 14 files / 48 tests、Playwright 7/7、PWA preview QA pass。fake/Chromium primary proofが揃ったため、星取り表のlocal verified scoreを100/100へ同期した。実MIDI・実Misskey投稿・X OAuth・PWA install promptはexternal gateとして残した。

## 2026-07-22 継続実装: 鼻歌条件付きACE-Step complete

- Humming takeをbrowserで22,050Hz PCM WAVへ正規化し、選択takeがあるfull-track jobに最大5MiBの一時source audioを付与した。gatewayはsourceをjob directoryへ一時保存し、ACE-Step `complete` taskへ`src_audio`と伴奏instructionを渡し、終了時にsource fileを削除する。job JSONやログへbase64本文は返さない。
- fake gateway、typed client、Chromium AI journeyへsource/reference audio条件付きの証跡を追加した。実RTX 5080 gatewayではsource＋reference付き5.12秒artifact、48kHz stereo、peak reserved 9,622MiB（hard cap 10,240MiB）、HTTP 200、両一時file削除を確認した。
- ACE-Step公式仕様の`complete` taskはsource audioと追加track instructionを受けるため、text2musicだけでなく、鼻歌由来の構造を保つ追加レイヤー経路として採用した。symbolic melodyは引き続き編集可能な正本とする。
- ボイスメモと参考音声も一時reference audioとしてgatewayへ渡せるようにし、文章・mood・音声を同じ生成candidateのintentへ結び付けた。Vitestは48 tests、source/reference payloadの非露出を確認した。

## 2026-07-22 継続: PWA自動登録の実測判定を修正

- `scripts/qa_pwa.mjs`がページロード直後の登録一覧だけを見ていたため、アプリの非同期登録をQA fallbackと誤表示していた。production preview（Chromium、127.0.0.1:4174）で`/sw.js`のapp登録呼び出し2件、scope、controller、`patchtone-shell-v1` cacheを実測した。
- QAへ初期化時の`serviceWorker.register`呼び出し・エラー記録と、5秒待機後の登録一覧判定を追加した。結果は`autoRegistered: true`、`manualRegistration: false`となり、install promptだけをexternal gateとして残した。
- 主語ファイル: `G:\devwork\music-compose-tool\scripts\qa_pwa.mjs`。再実行: `PATCHTONE_PWA_URL=http://127.0.0.1:4174 node scripts/qa_pwa.mjs`。
- `scripts/run_pwa_qa.mjs`を追加し、`npm.cmd run test:pwa`だけでproduction preview（4174）の起動・待機・登録観測・終了まで再現できるようにした。手動起動したサーバーや過去のservice worker登録へ依存しない。

## 2026-07-22 継続: Patchtone Night Grid visual refinement

- User feedbackに合わせ、Pastel Patchboardの構造は残しつつ、白ベースを黒〜濃紺のDTM surfaceへ変更した。通常面は情報を矩形の境界と余白でまとめ、角丸トークンは0pxへ統一した。
- 60分仕上げのピアノロールは専用のほぼ黒い編集面にし、gridを低彩度に抑え、melody / generated / activeをpastelのcyan / mint / lavender / pinkで識別する。色を構造の代わりに使わず、section roleの形と線種を保つ。
- Production React、静的Pastel prototype、PWA manifest / iconへ同じvariantを反映した。主語ファイルは`tokens.css`、`src/styles.css`、`src/features/melody/DawMelodyEditor.tsx`、`docs/design/prototypes/pastel-patchboard/theme.css`、`docs/design/prototypes/shared/workbench.js`。
- `scripts/validate_design_prototypes.py`、`npm.cmd run check`、`npm.cmd run test:e2e` 7/7、`npm.cmd run test:pwa`、`npm.cmd run test:dark`をpass。3 viewportでoverflow / console / network failure 0、editorで黒背景とradius 0を観測した。証跡は`docs/imp/evidence/dark-theme-qa-2026-07-22.json`と`dark-theme-*.png`。

## 2026-07-22 継続: user audio placement / multi-track piano-roll / stem coverage

- Audio Paletteへuser-owned WAV / MP3の`配置`を追加し、AI Layer audio laneへclipを置けるようにした。選択だけで終わらず、preview、manual save、project bundle、master WAV、STEMSへ同じasset IDを伝播する。
- `createStemBundle`はaudioClipsだけを持つtrackも抽出するように修正した。Chromiumでtone.wavを配置し、STEMS ZIPに`AI_Layer.wav`が含まれることを確認した。
- 60分DAWはMelodyだけでなく、notes / drums laneを持つtrackとMain / Sub laneを切り替えられる。伴奏trackのnoteも既存のpitch / timing / length、複数選択、copy / paste、MIDI command経路で編集できる。
- 主語ファイルは`src/features/audio/AudioPalette.tsx`、`src/features/projects/WorkspaceShell.tsx`、`src/features/melody/DawMelodyEditor.tsx`、`src/application/audio/exports.ts`。`npm.cmd run check`（49 tests）、DAW selector journey、user audio STEMS E2E、全7 E2Eをpassした。

## 2026-07-22 継続: project settings / addable note tracks

- 曲の設計tabのLength / Mood / Key / BPMを作成後も編集可能にし、`project/settings` commandでarrangement bars・preview tempo・AI条件を同期した。
- 60分DAWへLead / Synth / Pad / Arp / Percussion / FXの追加trackとMain / Sub lane、Track / Lane selectorを追加した。伴奏生成後も個別trackのnoteを同じCanvas操作で編集できる。
- `npm.cmd run check`（50 tests）とsettings + selectorを含むChromium DAW journeyをpass。主語ファイルは`src/domain/music/project-commands.ts`、`src/features/projects/WorkspaceShell.tsx`、`src/features/melody/DawMelodyEditor.tsx`。

## 2026-07-22 継続: instrument exchange runtime

- DAW mixerへbuilt-in音色selectを追加し、track/mixerの`instrumentId`をWeb Audio previewとOfflineAudio WAV renderへ反映した。factoryの旧instrument aliasは互換解決する。
- `npm.cmd run check`（51 tests）、audio-instrument unit、Chromiumの`Melody 音色`交換journeyをpass。user-owned assetはprivate AudioClipとして別経路に保つ。

## 2026-07-22 継続: range-loop transport

- DAWのLoop onをrealtime previewへ接続し、指定PPQ範囲を4回反復する有限transport planを追加した。symbolic noteとuser / AI AudioClipを同じ範囲で繰り返し、通常のWAV/STEMS exportは全曲のまま保つ。
- `npm.cmd run check`（52 tests）のloop unitで4反復とexport duration非短縮を確認した。主語ファイルは`src/domain/audio/audio-plan.ts`、`src/adapters/audio/web-audio-engine.ts`。

## 2026-07-22 継続: 音声レイヤー詳細編集

- 生成・ユーザー音声を配置したaudio laneを60分DAW画面の`音声レイヤー`パネルへ表示し、開始tick、長さtick、Gainを編集できるようにした。削除操作は`audio-clip/remove`へ接続した。
- component testで位置・Gain・削除commandを検証し、Chromium FHDでWAV配置→DAW表示→位置／Gain編集を確認した。
- `npm.cmd run check`（14 files / 53 tests）、`npm.cmd run test:e2e`（7/7、56.3秒）をpass。次回は実MIDI機器、実Misskey投稿、X OAuth、PWA install promptを外部gateとして扱う。

## 2026-07-22 継続: 直接録音のボイスメモ指示

- Humming Studioのイメージ指示へ、鼻歌とは別の`ボイスメモを録音`ボタンを追加した。最大30秒の録音をWAVへ正規化し、private audio assetとして保存した後、`spokenIntentAssetId`だけを更新する。
- 録音停止後も鼻歌録音と同じ画面で継続できることをChromium fake microphoneで確認した。鼻歌Melody notesとactive takeは変更しない。
- 直接録音したvoice memoをreference audioとしてACE-Step条件付きfull-track requestへ渡すChromium AI journeyもpassさせた。
- `npm.cmd run check`（14 files / 54 tests）と、対象Playwright testをpass。主語ファイルは`G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx`、`G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts`、`G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts`。

## 2026-07-22 継続: 暗色編集面の視覚ハードニング

- ユーザーの「白ベースではなく、黒〜青い暗色のDAW編集画面」というフィードバックに合わせ、選択中のsurface / phase / workspace tabを白反転から濃紺面＋pastel下線へ変更した。primary操作もcyan signal色へ寄せた。
- tokensのpaper / rule / editor blackを一段暗くし、角丸なし・矩形境界・piano-roll最暗面というPatchtone Night Gridの方針をproduction / static prototypeへ同期した。
- `npm.cmd run check`、`npm.cmd run test:e2e`（7/7）、`npm.cmd run test:dark`（3 viewport + editor）を再実行し、overflow・console error・request failureは0だった。
- 主語ファイル: `G:\devwork\music-compose-tool\docs\design\prototypes\pastel-patchboard\tokens.css`、`G:\devwork\music-compose-tool\src\styles.css`、`G:\devwork\music-compose-tool\docs\imp\imp-comp.md`。

## 2026-07-22 継続: production展開アセット候補選択

- static prototypeに存在していたTwin Drop / Gentle Rise / Story Breakを、production Arrangement Editorの`展開アセットを選ぶ` selectへ追加した。候補選択は`arrangement/replace` commandへ接続し、section role / bars / energy / transitionを一括適用する。
- section単位のTransition select（なし / Soft Rise）も追加した。melody notesは保持し、古いsectionに紐づくblockだけをdomain normalizeで整理する。
- domainへarrangement replaceのmelody保持・block追従unitを追加し、foundation E2EでGentle Rise（6 sections）→Twin Drop（7 sections）の交換を確認した。
- `npm.cmd run check`（14 files / 55 tests）、Chromium FHD foundation journey、progress syncをpass。主語ファイルは`G:\devwork\music-compose-tool\src\features\arrangement\ArrangementEditor.tsx`、`G:\devwork\music-compose-tool\src\domain\music\project-domain.test.ts`、`G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts`。

## 2026-07-22 継続: note inspectorによる直接編集

- 60分DAWのCanvasだけでなく、選択音符インスペクタからpitch / 開始tick / 長さtick / velocityを数値編集できるようにした。Pitch ±12 / ±1、grid nudge、Length ±1 grid、Velocity ±8、複製、削除を選択状態へ接続した。
- 直接編集は`note/update-many`、複製は`note/add-many`、削除は既存`note/remove`へ通し、melody lockとundo/redo境界をdomain commandへ維持した。
- component unitでpitch・length・duplicate commandを確認し、Chromium DAW journeyへ実操作を追加した。`npm.cmd run check`（14 files / 56 tests）、E2E 7/7、PWA QA、dark QAをpass。
- 主語ファイルは`G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx`、`G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.test.tsx`、`G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts`。

## 2026-07-22 継続: 鼻歌入力の対象小節範囲

- Humming Recorderへ「鼻歌を入れる小節数」を追加し、1 / 2 / 4 / 8 barsから選んだ範囲をBasic Pitchの`rangeEndTick`へ反映した。Section、開始小節、録音秒数、section終端の最小値で安全にclampする。
- Humming Recorder unitで1 barのtranscription rangeを確認し、Chromium microphone journeyでも1 bar選択→録音→Take保存を確認した。
- `npm.cmd run check`（14 files / 56 tests）、E2E 7/7、PWA QA、dark QAをpass。主語ファイルは`G:\devwork\music-compose-tool\src\features\humming\HummingRecorder.tsx`、`G:\devwork\music-compose-tool\src\features\humming\HummingRecorder.test.tsx`、`G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts`。

## 2026-07-22 継続: prototype操作差分とfeature progress matrix

- static prototypeの`ai-range`と`editor-scroll`、`editor-section`をproductionへ接続した。AI範囲は曲全体を初期値にしつつ、選択sectionでは対象sectionのtickだけをsymbolic fallback / gateway / ACE追加layerへ渡し、既存generated noteの範囲外を保持する。DAW表示位置はCanvasの横scrollLeftとrange sliderを双方向同期し、section overviewのボタンから該当barへジャンプできる。
- ユーザーから「チェックリストではなく、機能を行、UI・機能・動作確認・テストを列にしたマトリクス」と明確化されたため、`phase1-feature-progress-matrix.html`を追加した。18機能行を、local verifiedと実MIDI・実投稿・PWA install・EULA等の外部gateに分け、セルから正本・実装境界・証跡へリンクした。
- matrixはブラウザlocalStorageのレビュー評価を持つが、production Projectや外部データは変更しない。`validate_phase1_matrix.mjs`で必須列、18行、52リンクの存在を検査する。
- 検証: `npm.cmd run test:gateway`、対象Vitest 3 files / 11 tests、全体Vitest 15 files / 58 tests、Chromium FHD phase1 completion 4/4、`npm.cmd run validate:matrix`をpass。PWA QA、dark QA、全体delivery gateも再実行した。

## 2026-07-22 継続: matrixの星段階をユーザーブラッシュアップ前提へ修正

- ユーザーの訂正に合わせ、★3を「AIが自律的に確認できる上限」、★4を「ユーザーのブラッシュアップ完了」、★5を「AIの最終調整完了」と定義し直した。初期表示は全セルを3以下へcapし、UI / 操作は必ず★3で止める。★3を黄色、★2以下を赤、★4をcyan、★5をmintとした。
- 単一リンクだったセル下部を「関連ファイル一覧」へ変更し、主ファイルと列共通の正本・監査・実行定義・active taskを一覧表示する。レビュー上書きstorage keyはv2へ更新した。
- 主語ファイルは`G:\devwork\music-compose-tool\docs\imp\phase1-feature-progress-matrix.html`、`G:\devwork\music-compose-tool\scripts\validate_phase1_matrix.mjs`、`G:\devwork\music-compose-tool\docs\guide\implementation-context-reading-guide.md`、`G:\devwork\music-compose-tool\docs\imp\imp-comp.md`。
- 検証: `npm.cmd run validate:matrix`（18 rows / 54 unique links）、Chrome直接表示（18 rows / 175 file links / page error 0）、既存 `npm.cmd run check`（15 files / 58 tests）、Chromium FHD 7/7。

## 2026-07-22 MIC-010: 2ch microphone inputのmono自動正規化

- ユーザーの物理microphone経路で、Basic Pitchが「入力オーディオバッファはモノラルではありません。チャンネル数は2です。1であるべきです。」と失敗した。`channelCount: 1`要求だけでは機器の2ch出力を保証できず、decoded stereo bufferを解析へ直渡ししていた。
- `downmixChannelsToMono`でdecoded全channelをframe単位に平均し、Basic Pitchへ渡す直前の`AudioBuffer`を必ず1chにした。`audioBlobToWav`も同じ変換を使い、鼻歌、ボイスメモ、AI source / referenceのPCM WAV headerを1chへ統一した。
- 2ch fixtureのchannel average、mono PCM16 WAV header、2ch humming→同梱Basic Pitch音符化、2ch source / reference→gateway受信1chを回帰testにした。物理microphoneの再確認はユーザーによる★4判断へ残す。
- 主語ファイル: [basic-pitch-transcriber.ts](G:\devwork\music-compose-tool\src\adapters\humming\basic-pitch-transcriber.ts)、[basic-pitch-transcriber.test.ts](G:\devwork\music-compose-tool\src\adapters\humming\basic-pitch-transcriber.test.ts)、[foundation.spec.ts](G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts)、[phase1-completion.spec.ts](G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts)、[mono regression evidence](G:\devwork\music-compose-tool\docs\imp\evidence\stereo-mono-input-regression-2026-07-22.json)。
- Proof: 対象AI layer E2E 1/1、`npm.cmd run check`（Vitest 15 files / 60 tests）、`npm.cmd run test:e2e`（Chromium FHD 7/7）pass。Viteの1MiB超Basic Pitch chunk warningは既知で、失敗ではない。

## 2026-07-22 継続: ACE-Step source / reference gateway runtime再実測

- job `job-7e7db300-d119-4422-ad18-69a6f2b1c165`でsource audio、reference audio、melody notesを条件にしたACE-Step 1.5 DiT-only `complete` taskを実行し、5.12秒・48kHz stereo artifactをHTTP 200で取得した。
- peak reserved 9,624MiBは10,240MiB cap内。source / reference一時file削除、model unload、artifact SHA-256を確認した。1.7B LM profileは起動禁止のまま再実行していない。
- 証跡: [ace-step-gateway-runtime-2026-07-22.json](G:\devwork\music-compose-tool\docs\imp\evidence\ace-step-gateway-runtime-2026-07-22.json)。主観的なFuture Bass / Core fitと鼻歌追従品質はユーザー試聴へ残す。

## 2026-07-22 AI-011: gateway停止時の追加layer recovery

- 実操作の`Home AI gateway returned malformed JSON`はmodel出力ではなく、gateway未起動時にVite proxyが返した空の502 text/plainだった。direct 17321はconnection refused、4173 proxyは502を再現した。
- proxy / clientで`gateway-unavailable`へ正規化し、UIはoffline・再起動・再試行を表示する。2xx非JSONだけをmalformed responseとして残し、原因を混同しない。
- `npm.cmd run gateway:ace`を追加し、検証済みPython / guard script / checkpointを検査してDiT-onlyだけを起動する。PID 59016でdirect / proxy health 200、model unloaded、queue 0、待機GPU約2.4GiBを確認した。
- 主語ファイル: [home-ai-gateway.ts](G:\devwork\music-compose-tool\src\adapters\ai\home-ai-gateway.ts)、[AccompanimentPanel.tsx](G:\devwork\music-compose-tool\src\features\humming\AccompanimentPanel.tsx)、[vite.config.ts](G:\devwork\music-compose-tool\vite.config.ts)、[start_ace_gateway.mjs](G:\devwork\music-compose-tool\scripts\start_ace_gateway.mjs)、[offline recovery evidence](G:\devwork\music-compose-tool\docs\imp\evidence\home-ai-gateway-offline-recovery-2026-07-22.json)。
- Proof: focused client 8/8、offline E2E 1/1、Vitest 62、gateway smoke、build、Chromium FHD 8/8、ESLint warning 0。

## 2026-07-22 DES-004: 操作色の文法とclick affordance

- 実画面で一般button、selected state、音楽role、statusがそれぞれcyan / orange / purple / mintを使い、押せる場所の共通手掛かりが無いことを確認した。ユーザー提案の「黒ベース＋黄色枠」をsemantic ruleへ昇格した。
- yellowを操作可能control、pastelを音楽データ、greenを成功・接続、redを失敗・録音・削除、grayを非操作・disabledへ限定した。primaryはsolid yellow、secondaryはyellow outline、tab / phaseはyellow markerとし、一般panelはdark neutralへ戻した。
- Home、asset audition / placement、arrangement、Humming、保存・export、DAW toolbar / inspector / mixer / automationへ統一適用した。track roleのpastelは細いsignal stripeとCanvas noteへ維持した。
- `qa_dark_theme.mjs`へcomputed styleのcolor contractを追加し、1440 / 768 / 375px homeと1440px editorでoverflow・console・request failure 0を確認した。`npm.cmd run check`はVitest 62、Chromium FHD E2Eは8/8。UI評価は★3でユーザー確認待ち。
- 主語ファイル: [tokens.css](G:\devwork\music-compose-tool\docs\design\prototypes\pastel-patchboard\tokens.css)、[styles.css](G:\devwork\music-compose-tool\src\styles.css)、[design-directions.md](G:\devwork\music-compose-tool\docs\design\design-directions.md)、[qa_dark_theme.mjs](G:\devwork\music-compose-tool\scripts\qa_dark_theme.mjs)、[dark editor screenshot](G:\devwork\music-compose-tool\docs\imp\evidence\dark-theme-editor-1440.png)。

## 2026-07-22 PIVOT-001: AI StarterとPattern-first合流

- 3入口をAI Starter、Pattern Board、experimental Hummingへ再編した。AI Starterは編集可能なstarter melodyと6-role伴奏をTemplate Harmonizer fallbackで即作成し、実routeを表示する。
- 1小節pad編集が残りのAI生成chordを消さないよう、pattern被覆tickだけを置換するmergeへ変更した。`MIDI譜面を編集`でblockをmanual NoteEventへ展開し、3入口から60分DAWとStandard MIDIへ合流する。
- 内蔵音色を41個へ拡張し、31 tonal presetすべてに固有multi-layer synthesis profileを付けた。カテゴリfilterとChord 9音色の即時試聴を追加した。
- hover / focus lift、section grabbed / drop target、Canvas note hover / move / resize status、reduced motionを追加した。375px DAWの横はみ出しを修正した。
- `npm.cmd run check`はVitest 20 files / 76 tests、matrix 25 rows / 52 linksを含めpass。Chromium FHD E2E 10/10 pass。screenshotsと詳細は`docs/imp/evidence/ai-starter-pattern-convergence-2026-07-22.json`。UI / 音楽品質は★3 user review待ちで、PIVOT-001自体はrole追従patternを次unitとしてactiveのまま維持する。
