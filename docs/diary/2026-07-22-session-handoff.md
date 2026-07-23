# Session handoff: Harmonic Atlas / Dark Pastel実装後

日付: 2026-07-22  
Repository: `G:\devwork\music-compose-tool`  
Branch: `main`  
Remote: `https://github.com/rohto4/music-compose-tool.git`

## 最新追記: Harmonic AtlasとDark Pastel

下記の旧`Pattern-first再編`追記をさらに更新する。Pattern Boardの現在地はChord 9ではなく、31 tonal Voice Deck、全14コードHarmonic Atlas、STEP別1〜4拍である。

- Chord PadはChord / Synth / Pad / Lead / Arp / Bassの6 family、31 tonal音色を和音として即時発音する。`LIVE VOICE · 31`と現在音色を常時表示する。
- 基本7、彩り4、意外3をtabで隠さず全14候補として同時表示し、degree主軸と関連列へ置く。全候補が1 tap試聴・配置。
- 4 / 8はprogression STEP数。各STEPは1〜4拍で、累積tick、loop、Web Audio、MIDI、saveへ同じdurationを使う。
- P / Hは左上の丸い2 control。画面全体は「全体を隠さない、現在値を残す、形で役割を分ける、1 tapで返す」へ統一し、near-blackからblue-violet / lavender / blue-greenのDark Pastelへ変更した。
- 1920×1080でChord Pad全体下端921px、Atlas下端887px、横overflow 0。375pxもdocument overflow 0。
- 最新proof: Vitest 20 files / 79 tests、Chromium FHD 10/10、dark QA 4面、PWA runtime、matrix 26 rows / 58 links。UI / 操作 / 音楽品質は★3で、ユーザーのブラッシュアップ後だけ★4。
- 次unitはBass / Arp / Drumのrole追従pattern browser。60分DAWは未レビューの★3として保持し、Humming / ACEもexperimentalのまま削除しない。

## 最新追記: Pattern-first再編とAI Starter

この追記は、下記の「次sessionの優先順」にあるHumming / ACE中心の順序を更新する。現在のprimaryはAI StarterとPattern Board、Humming Studioはexperimental third entryである。

- AI StarterはTemplate Harmonizer local fallbackでstarter melodyとChord / Bass / Drum / Pad / Arp / Synthを編集可能なNoteEventへ作る。実routeをUIに表示し、flat audioだけを正本にしない。
- Pattern Boardのchord padは選択中音色で即時発音する。現在は上の最新追記どおり31 tonal音色と可変拍STEPへ拡張済み。被覆外のAI生成chordは保持する。
- `MIDI譜面を編集`でpattern blockをmanual NoteEventへ展開し、AI Starter / Pattern Board / Humming Studioの3入口から既存60分DAWとStandard MIDIへ合流する。
- 内蔵音色は41個。31 tonal profileは重複なしで、全てChord Voice Deckから選択できる。外部sampleは追加していない。
- hover / focus lift、section drag grabbed / drop target、Canvas note hover / move / resize status、reduced motionを追加した。375px AI Starter→DAWはdocument overflow 0。
- この追記時点のproofは旧値。現在の正本proofは先頭のHarmonic Atlas追記を参照する。
- PIVOT-001は完了扱いにしない。次unitはBass / Arp / Drumのrole追従pattern browserと、ユーザーによる41音色・hover / drag・AI Starterの★4ブラッシュアップ。60分DAWは★3のまま保持する。

## 追記: 追加layer gateway offline修正

handoff作成後の実操作で`Home AI gateway returned malformed JSON`を確認し、AI-011として修正済み。原因はACE-StepのJSON破損ではなく、gateway停止時のVite proxy空502だった。

- proxy / clientは停止・network refusal・5xx非JSONを`gateway-unavailable`へ正規化する。
- UIはHome AI offlineと`npm.cmd run gateway:ace`による再起動を案内し、編集可能伴奏を保持する。
- `npm.cmd run gateway:ace`は検証済みDiT-only構成を検査して起動する。引き継ぎ更新時はPID 59016、health 200、model unloaded、queue 0。
- latest proof: Vitest 15 files / 62 tests、Chromium FHD 8/8。
- ユーザーは現在のmelodyで追加layerを再試行し、生成音を試聴する。★4への更新はその回答後。

## 次sessionの一文

最初にHarmonic Atlasをユーザーに実画面確認してもらい、31音色の聴感、全14コードの位置関係、1〜4拍STEP、Dark Pastelの柔らかさを部品単位で反映する。次にBass / Arp / Drumのrole追従pattern browserへ進む。物理microphone / ACEはexperimental reviewとして残すが、primary設計を鼻歌中心へ戻さない。

## 引き継ぐ目的

Pastel Patchboard / Harmonic Atlasを、AI Starterまたは31音色Chord Padからすぐ曲を組み、必要なら鼻歌由来melody、DAW編集、保存、WAV / STEMS / MIDI / project出力へ進めるlocal Web / PWAとして仕上げる。

Phase 1のlocal technical pathは進捗表上100/100 verifiedだが、これは「adapter実装とAI / browser自動確認が揃った」という意味である。0%をmock、100%を希望する音楽品質・操作感までユーザーが磨き終えた状態とする完成監査は約76%。星取り表のdefault上限は★3であり、★4はユーザーのブラッシュアップ完了、★5はその後のAI最終調整完了だけに使う。

## 最新のUI修正: DES-004 interaction color grammar

- ユーザーの「色が多く、どこを押すと何が起きるか分からない」という実画面判定を受け、yellowを操作可能controlの専用色にした。
- primary actionはsolid yellow、secondary actionはyellow outline、selected tab / phaseはyellow marker。pastelはnote / track / assetの音楽role、greenは成功・接続、redは失敗・録音・削除、grayは非操作・disabledだけに使う。
- Home、音の試聴・配置、展開、Humming、transport、保存・export、DAW toolbar / mixer / automationへ適用した。色だけでなく矩形枠、動詞label、focus、`aria-current` / `aria-pressed`を併用する。
- `npm.cmd run check`はVitest 15 files / 62 tests、Chromium FHD E2E 8/8、dark QAは1440 / 768 / 375px＋editorでfailure 0。UI / 操作は★3のままユーザー確認待ち。
- 主語: [tokens.css](../../docs/design/prototypes/pastel-patchboard/tokens.css)、[styles.css](../../src/styles.css)、[design direction](../../docs/design/design-directions.md)、[dark QA evidence](../imp/evidence/dark-theme-qa-2026-07-22.json)。

## このsessionで閉じた不具合

物理microphoneで次のBasic Pitch errorが発生した。

> 入力オーディオバッファはモノラルではありません！チャンネル数は2です。1であるべきです。

原因は`getUserMedia({ channelCount: 1 })`が希望制約に過ぎず、機器 / browserが返した2ch `AudioBuffer`を従来のadapterがBasic Pitchへ直渡ししていたこと。

修正済み:

- decoded全channelをframe単位で平均し、明示的な`ArrayBuffer` backingを持つmono `Float32Array`へ変換する。
- `audioBlobToWav`はmicrophone、imported humming、voice memo、ACE source / referenceをPCM16 monoへ統一する。
- Basic Pitch呼び出し直前にも1ch `AudioBuffer`を保証し、上流を迂回した入力へ二重防御する。
- 2ch鼻歌fixtureと2ch参考音声fixtureを回帰testに固定した。

主要file:

- [Basic Pitch adapter](../../src/adapters/humming/basic-pitch-transcriber.ts)
- [downmix / WAV unit test](../../src/adapters/humming/basic-pitch-transcriber.test.ts)
- [microphone / Basic Pitch E2E](../../tests/e2e/foundation.spec.ts)
- [AI source / reference E2E](../../tests/e2e/phase1-completion.spec.ts)
- [mono regression evidence](../imp/evidence/stereo-mono-input-regression-2026-07-22.json)

## 最後のverification

- 対象AI layer Playwright: 1/1 pass。2ch source / referenceがgateway requestでは双方1ch。
- `npm.cmd run check`: pass。
  - ESLint / TypeScript pass
  - Vitest 15 files / 60 tests pass
  - home AI gateway smoke pass
  - production build pass
  - phase progress / feature matrix validation pass
- `npm.cmd run test:e2e`: Chromium FHD 7/7 pass。
  - 2ch humming file→bundled Basic Pitch notesを含む。
- ViteのBasic Pitch chunkが500kBを超えるwarningは既知の非blocking warning。

## ACE-Stepの最新実測

- job: `job-7e7db300-d119-4422-ad18-69a6f2b1c165`
- backend / task: ACE-Step 1.5 DiT-only / `complete`
- conditioning: source audio + reference audio + melody notes
- output: 5.12秒、48kHz stereo、HTTP 200、1,966,168 bytes
- peak reserved: 9,624MiB / hard cap 10,240MiB
- timing: DiT init 4.614秒、generation 1.542秒、total 6.159秒
- cleanup: source / reference一時file削除、job後model unload済み
- evidence: [ace-step-gateway-runtime-2026-07-22.json](../imp/evidence/ace-step-gateway-runtime-2026-07-22.json)

1.7B LM profileは14,128MiBでcap超過のため起動禁止。次sessionでも実行しない。ACE gateway / modelは引き継ぎ時点で常駐させていない。Future Bass / Coreの主観fit、長尺、鼻歌追従品質はユーザー試聴待ち。

## 現在のruntime状態

引き継ぎ作成時点では`http://127.0.0.1:4173/`がHTTP 200、title `Patchtone`で応答した。ただしprocess寿命はsessionを跨いで保証しない。次session開始時に必ず再確認し、応答しない場合だけrepository rootで`npm.cmd run dev`を起動する。修正前のpageを開いたままならhard reloadする。

## 次sessionの優先順

1. 下記の正本をfile実体から読み直す。
2. `git status --short`と`http://127.0.0.1:4173/`を確認する。
3. ユーザーの物理microphoneで鼻歌録音→停止→解析→Melody適用を再試験する。
4. errorが消えて音符が出た場合、その所感を`user-judge.md`と日誌へ記録する。ユーザーが明示的にブラッシュアップ完了と判断するまでUI / 操作cellは★3のままにする。
5. errorが残る場合、表示error全文、recorded MIME、decoded channel count、browser consoleを取得し、同じnormalizer境界を診断する。raw録音assetのmigrationは別taskにする。
6. 次にACE短尺artifactをユーザーに聴いてもらい、genre fit・鼻歌追従・伴奏の編集しやすさを確認する。
7. その後だけ、ユーザー指摘をUI / 音楽品質へ反映し、★4→AI最終調整→★5を進める。

## 残るexternal / user gate

- 物理microphone再試験とUI / 音楽結果のブラッシュアップ
- ACE-Stepの主観試聴、長尺、Future Bass / Core fit
- 実MIDI機器
- 実Misskey instance投稿、X OAuth
- PWA install prompt実機
- Studio One / BOOTH素材の個別EULA・再配布条件
- Cloudflare経由のpublic deploy（Phase 1対象外）

## Git / safety境界

- `git status --short`はrepositoryのtop-level一式を`??`として表示する。初回commit前のworktreeであり、今回もstage、commit、pushはしていない。
- user変更を含むため、`git reset --hard`、checkoutによる破棄、broad stagingを行わない。
- 外部credential、account、public resource、deployは新しい明示許可なしに触らない。
- 10,240MiB VRAM hard capを維持する。
- 既存subagent 3件はすべてcompletedで、active child workはない。
- 既存Goalを確認した時点のstatusはpaused。次sessionでGoalが存在する場合は重複作成せず、そのobjectiveを継続する。

## 正本の読み順

1. [AGENTS.md](../../AGENTS.md)
2. [PROJECT.md](../../PROJECT.md)
3. [tech-stack.md](../../tech-stack.md)
4. [README.md](../../README.md)
5. [user-tasks.md](../imp/user-tasks.md)
6. [implementation-context-reading-guide.md](../guide/implementation-context-reading-guide.md)
7. [imp-tasks.md](../imp/imp-tasks.md)
8. [user-judge.md](../imp/user-judge.md)
9. [imp-comp.md](../imp/imp-comp.md)
10. このhandoff

## 状態を見るfile

- [機能別星取り表](../imp/phase1-feature-progress-matrix.html)
- [Phase 1進捗正本](../imp/phase1-progress.md)
- [利用者目線の完成監査](../imp/phase1-completion-audit-2026-07-22.md)
- [Phase 1実装日誌](2026-07-22-phase1-implementation.md)
- [次session用prompt](2026-07-22-next-session-prompt.md)

Knowledge Vaultも同期済み:

- `G:\knowledge-vault\knowledge\dev\editable-audio-layer-and-bundle-pattern.md`
- `G:\knowledge-vault\records\2026-07-22-music-compose-tool-phase1.md`
