# Phase 1 Progress Star Chart

## Status legend

| Mark | Machine status | Meaning |
| --- | --- | --- |
| ★ | `verified` | 実装とPrimary proofが揃った |
| ◐ | `active` | 現在作業中。weightはまだ加算しない |
| ☆ | `ready` | 依存が揃えば着手可能 |
| · | `pending` | 依存unit待ち |
| ◇ | `external` | 実装と外部資格情報 / actual device確認を分離 |
| ⚠ | `blocked` | 同一阻害要因が継続し、代替経路もない |

## Current snapshot

- Updated: `2026-07-22 JST`
- Goal: active
- Phase 0 preparation: `verified`
- Phase 1 local verified score: `100 / 100`（local実装・fake/Chromium primary proofまで。実機・実アカウント確認は外部gateとして別管理）
- Current unit: `PIVOT-001 / Harmonic Atlas user review / role-follow pattern breadth`
- Morning demo milestone: `active`
- Blocking condition: none
- Blueprint: `phase1-blueprint.md`
- Human view: `phase1-progress.html`
- Feature matrix: `phase1-feature-progress-matrix.html`（機能行 × UI / 実装・データ / 動作確認 / テスト / 運用・外部gate）。この表の★は段階評価で、★3=AI自律確認、★4=ユーザーブラッシュアップ完了、★5=AI最終調整完了。UI / 操作はユーザー確認まで★3で止める。

## Star chart

| Mark | ID | W | Status | Outcome | Depends | Next proof / action |
| --- | --- | ---: | --- | --- | --- | --- |
| ★ | P1-FND | 5 | verified | production scaffold | Phase 0 | exact install、typecheck、build、smoke pass |
| ★ | P1-DOM | 6 | verified | production music domain / schema | P1-FND | 7 contract / migration tests pass |
| ★ | P1-PRJ | 6 | verified | manual save / project bundle / editable project settings | P1-DOM | settings + save-reload-export-import E2E pass |
| ★ | P1-AUD | 8 | verified | realtime sound / 41-role timbre bank / 31-voice Chord Deck / asset import / audio layer edit | P1-DOM | 31 unique tonal profiles、6 family Chord audition、WAV decode / reload E2E / clip position-gain edit pass |
| ★ | P1-ARR | 6 | verified | arrangement flow assets / main-sub lane | P1-DOM | candidate select / drag / keyboard / undo / block E2E pass |
| ★ | P1-HAR | 8 | verified | humming-first accompaniment | P1-AUD, P1-ARR | melody-lock / editable track E2E pass |
| ★ | P1-DAW | 11 | verified | Canvas whole-song DAW editor（Track / Main-Sub Lane・note・音声clip・複数編集・note inspector） | P1-DOM, P1-ARR | Chromium FHD DAW journey / unit pass |
| ★ | P1-MIX | 7 | verified | mixer・音色交換・FX・automation・range-loopを再生 / WAVへ反映 | P1-AUD, P1-DAW | FX / instrument / loop plan・OfflineAudio render・UI journey pass |
| ★ | P1-MIC | 8 | verified | microphone / Basic Pitch | P1-DOM, P1-AUD | 2ch inputのmono自動downmix / fake media / real model / take compare pass。物理mic再確認はuser gate |
| ★ | P1-INT | 6 | verified | 別pageのHumming Studio / natural-language refine / voice memo recording | P1-PRJ, P1-MIC, P1-HAR | intent / voice memo / reference / refine / handoff E2E pass |
| ★ | P1-AI | 8 | verified | local gateway、10GiB cap、symbolic fallback、鼻歌条件付きACE追加layer | P1-INT, P1-HAR | offline 502→retryable状態、`gateway:ace` launcher、`complete` task 5.12秒 / 9,624MiB pass。主観試聴はuser gate |
| ★ | P1-EXP | 8 | verified | master WAV / audio-only track STEMS zip / Standard MIDI / project | P1-AUD, P1-MIX, P1-PRJ | Chromium FHD download + non-silent audio envelope + parser fixtures pass |
| ★ | P1-MIDI | 4 | verified | Web MIDI接続入口とnote追加 | P1-AUD, P1-DAW | fake device note-on/off + duration E2E pass（実機はexternal） |
| ★ | P1-PWA | 3 | verified | PWA / responsive / a11y | UI units | production preview manifest / app自動登録 / service worker / cache + viewport QA pass（install実機はexternal、証跡 `docs/imp/evidence/pwa-runtime-qa-2026-07-22.json`） |
| ★ | P1-SHR | 2 | verified | X / Misskey share intent + explicit Misskey post adapter | P1-EXP, P1-PRJ | fake HTTP + Chromium post journey pass（実instance/X OAuthはexternal） |
| ★ | P1-QA | 4 | verified | full delivery gate / Harmonic Atlas / Dark Pastel grammar | all | check 20 files / 79 tests、10 E2E、Full HD Atlas下端921px / 375px overflow 0。UIは★3 user review待ち |

## Morning demo path

| Mark | Demo slice | Observable completion |
| --- | --- | --- |
| ★ | Scaffold | local URLでproduction React appが開く |
| ★ | Project | 新規projectを作成・保存・再読込できる |
| ★ | Sound | assetを1 tap試聴しtimelineを再生できる |
| ★ | Arrangement | sectionと音のピースを交換できる |
| ★ | Accompaniment | melodyに合わせて編集可能な伴奏を作れる |
| ★ | Edit | piano rollでnoteを追加・移動・長さ変更できる |
| ★ | Save / export | manual saveしmaster WAVをdownloadできる |

## External gates that do not stop local work

| Surface | Implementation | Live verification need |
| --- | --- | --- |
| Misskey post | instance URL allowlist、token inputを永続保存しないadapter、preview | user-owned instanceと短期token、test note content |
| X post | share intent baseline、direct API adapter boundary | developer project / OAuth credentialとtest post approval |
| Web MIDI | fake MIDI adapter | actual MIDI deviceとbrowser permission |
| Studio One content | WAV / MP3 user-owned-export import | exact content / EULA確認 |
