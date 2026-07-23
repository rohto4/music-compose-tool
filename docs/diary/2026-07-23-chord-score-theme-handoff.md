# Session handoff: Chord Score / Creative Brief / 3 themes / role patterns

日付: 2026-07-23  
Repository: `G:\devwork\music-compose-tool`  
Branch: `main`

## 現在地

2026-07-23の連続feedbackを、コンテキスト圧縮で欠落しないよう`PIVOT-001`、`MOB-004`、`DES-005`、`DAW-006`へ起票し、local実装とAI自律確認まで完了した。機能別マトリクスは32行。新規6行はすべて★3で、★4はユーザーのブラッシュアップ完了後だけにする。

- 4小節phraseを上限なく追加。各phraseは4 / 8 step、8分音符単位、付点4分、AUTO配分で16拍。desktopは8小節／譜面行、smartphoneは4小節／段。
- 初期4 phrase＝16小節。全曲loop、Web Audio、MIDI、save / reloadはphrase連結から算出。
- Smartphone Chord Padはpointerdownからrelease / cancelまで現在音色でsustain。全14 chordは7列、最小44px、Atlas / document横overflow 0。
- 人向けコード譜、ABC 2.1、Instrumental-only Creative Brief Markdown、versioned JSON、`.mctproj`をcopy / download。歌詞、歌声、spoken wordsは禁止。
- 10 / 30 / 60 surfaceを`ラフ制作`と`カスタマイズ`へ統合。section editorと既存DAWを保持。
- DAWにblank-drag marquee、Shift追加選択、複数note atomic move、drag ghost / delta、cancel、undo / redoを追加。DAWはユーザー正式review前の★3。
- layoutを保ち、Dark Pastel Studio、Vanilla Pastel、Friendly Signalの3 themeをlocalStorage保存。Project dataへ含めない。
- Bass / Arp / Drum各5種、合計15の4小節patternを試聴・phrase適用できるbrowserを追加。Bass / Arpはコード差替えへ追従し、Drumはphrase境界へ整列する。旧patternの手編集noteと他phraseを保護し、undo / redo、save / reload、WAV / STEMS / MIDIへ合流する。
- MIDI writerの既存`drums` lane除外を修正し、Drum patternをchannel 10へ出力する。

## Verification

- `npm.cmd run check`: pass。Vitest 23 files / 95 tests、gateway smoke、production build、phase progress、matrix 32 rows / 77 local links。
- `npm.cmd run test:e2e`: Chromium 11/11 pass、3分02秒。長尺WAV / STEMSと配置音声入りproject round-tripを含む。
- `npm.cmd run test:dark`: pass。1440 / 768 / 375 Home、1440 DAW、console / request failure / overflow 0。
- `npm.cmd run test:pwa`: pass。manifest、service worker controller、shell cache、自動登録。
- visual QA: 2560×1440、1920×1080、1440×900、768×1024、375×812。3 themeのChord Board geometry一致、4 phrase、14 chord、15 role pattern、unnamed button 0、横overflow 0。

## 次sessionの優先順

1. 正本を再読し、`docs/imp/phase1-feature-progress-matrix.html`の先頭6行を確認する。
2. ユーザーに実画面で、無制限phrase、8分音符AUTO、スマホ長押し、15 role patternの聴感差、Prompt出力、ラフ／カスタマイズ、3 theme、DAW矩形選択を部品単位で確認してもらう。
3. 指摘を反映しても、ユーザーがブラッシュアップ完了と明示するまでは★3を維持する。既存DAWとHumming / ACEを削除・置換しない。
4. localで次へ進める場合も、15 role patternの音楽的fitは推測で★4へ上げない。ユーザー指摘がなければ、`PIVOT-001`の既存音色・patternの聴感差、DAW操作、実Studio One handoffのうちlocalで安全に改善できる箇所を続ける。license未確認音源を追加しない。

## 主要file

- [active tasks](../imp/imp-tasks.md)
- [user decisions](../imp/user-judge.md)
- [completion evidence](../imp/imp-comp.md)
- [feature matrix](../imp/phase1-feature-progress-matrix.html)
- [Pattern architecture](../arch/pattern-board-foundation.md)
- [workflow / score research](../research/composition-workflow-prompt-and-score-formats-2026-07-23.md)
- [Chord Score UI](../../src/features/patterns/ChordPatternBoard.tsx)
- [role pattern generator](../../src/domain/music/role-patterns.ts)
- [Creative Brief](../../src/application/projects/creative-brief.ts)
- [DAW editor](../../src/features/melody/DawMelodyEditor.tsx)
- [responsive evidence](../imp/evidence/theme-responsive-qa-2026-07-23.json)
- [applied role pattern evidence](../imp/evidence/role-pattern-applied-wqhd-dark-2026-07-23.png)

## Safety / external gates

- 初回commit前でrepository一式はuntracked。reset、checkout破棄、broad staging、commit、pushをしない。
- 外部credential、SNS実投稿、Cloudflare resource / deploy、Studio One専用asset取込みは別承認。
- 1.7B LMは14,128MiBでVRAM cap超過のため起動禁止。Humming / ACEはexperimentalのまま。
