# Repository audit (2026-07-22)

この監査は、Phase 1 の実装着手後に production scaffold、既存の実動作範囲、未実装の完成条件、実行上の不整合を切り分けるためのものです。ここに書く内容は、ソースとローカルコマンドから確認した事実です。

## 確認済みの基盤

- `package.json` / `package-lock.json` は React 19.2.7、TypeScript 6.0.3、Vite 8.1.5、Vitest 4.1.10、Playwright 1.61.1 を固定している。
- `src/domain/music` に Project / Track / Main-Sub Lane / Note / Automation / command history があり、note add/update/remove、track mixer、automation、loop の domain command は既に定義されている。
- `src/features/projects` に複数 project の Home、新規作成、IndexedDB の明示保存、`.mctproj` import / export がある。
- `src/features/audio` に built-in asset の1タップ試聴、WAV / MP3 の user asset import がある。実音源ではなく Web Audio の内蔵 synth / noise が正本である。
- user-owned WAV / MP3はAudio Paletteの`配置`からreference audio laneへclip化でき、preview / bundle / master WAV / STEMSへ同じassetを通す。60分DAWの音声レイヤーで位置／長さ／Gain／削除を編集でき、audio-only trackもSTEMS対象にする。
- `src/features/arrangement` に Intro / Verse / Build / Drop / Break / Bridge / Outro の追加、長さ・energy変更、drag / 前後buttonによる並べ替え、Main / Sub block配置がある。
- `src/features/humming` と `src/adapters/humming` に最大30秒の microphone / file take、take比較、Basic Pitch dynamic import、PPQ 480 note 変換がある。
- 最新の local test は `npm.cmd test` で 14 files / 53 tests が pass。`npm.cmd run lint`、`npm.cmd run typecheck`、`npm.cmd run build`、`npm.cmd run validate:progress` も pass した（2026-07-22）。
- 最新の visual QA は `npm.cmd run test:dark` で1440 / 768 / 375pxのhomeと1440pxのeditorを観測し、角丸token 0、専用editor-black背景、horizontal overflow 0、console error 0、request failure 0を確認した。variantは`Patchtone Night Grid`。

## 実装上の不足（Phase 1 星取り表との照合）

| Unit | ソース上の不足 |
| --- | --- |
| P1-DAW | Canvas piano-rollへTrack / Main-Sub Lane selector、grid、double-click add、Shift選択、copy/paste、Delete、loop、zoom、pitch/timing drag、right-edge length resize、音声レイヤーの位置／Gain／削除を実装。Chromium FHD DAW journeyとdomain/UI testsで確認済み。 |
| P1-MIX | volume / pan / mute / solo、filter / reverb / delay / sidechain、automationをdomain、Web Audio、OfflineAudio exportへ反映。FX plan / UI journeyで確認済み。 |
| P1-INT / P1-AI | Humming Studioの文章・mood・ボイスメモ・参考音声を保存し、intent variantを伴奏へ反映。選択鼻歌takeをWAV化し参考音声も添えてACE-Step `complete`へ渡すfull-trackをgateway経由で5.12秒生成しartifact 200、peak reserved 9,622MiB（上限内）、source/reference削除を確認。browser fixtureは追加layer importとPatchboard handoffまで通過。 |
| P1-EXP | master WAV / track STEMS zip / standard MIDIのencoder・download、audio-only reference/user layerのstem抽出、MIDI/WAV/STEMS parser fixture、project bundle audio同梱 / 復元を実装。Chromium FHDでRIFF/WAVE・PK・MThd download envelopeを確認済み。 |
| P1-MIDI | Web MIDI note-on/off duration確定、重複同音・handler cleanup、fake deviceからnote-on/offを送るChromium journeyを確認。実機はexternal gate。 |
| P1-PWA | manifest / service worker登録、1440 / 768 / 375px browser QAでoverflow 0、critical console/network failure 0。install実機は残課題。 |
| P1-SHR | X / Misskeyのcredential-free intentに加え、Misskeyは明示クリック + 一時tokenの直接投稿adapterを実装し、fake HTTP / Chromium journeyで確認。実instance投稿とX OAuthはexternal gate。 |
| P1-QA | Chromium FHD 7 journey（foundation / microphone / Basic Pitch / DAW-MIX / AI追加layer / WAV-STEMS-MIDI download / Misskey投稿）とPWA preview QAを追加。実機MIDI、actual投稿、PWA installは残課題。 |
| DES-002 visual | production + static prototypeの暗色token、黒いCanvas editor、角丸0px、PWA theme/iconを同期。Chromium 3 viewport + editorの専用dark QAをpass。 |

## 注意すべき設計差分

- `src/domain/audio/audio-plan.ts` は Track の muted / solo / volume / pan / fx、Automationをnote eventへ反映する。AudioClipはWeb Audio / OfflineAudio adapterがasset repositoryからdecodeしてscheduleする。
- `WorkspaceShell` の Patchboard は4 tabを持ち、10分ラフでは展開編集を固定、30分整形からArrangement Editor、60分仕上げでCanvas DAWを開く。foundation E2Eは30分への遷移を含めて確認済み。
- `buildProjectAudioPlan()` の既定barsはarrangement sectionの合計（最小8）へ更新済み。OfflineAudio exportのstem分離とAudioClip / automation反映も、parser / browser download envelopeを含めて確認済み。
- `AudioPalette` の user assetは`.mctproj`のmanifest metadata + binary payloadへ同梱され、import時にrepositoryへ復元する。asset missing / 256MiB上限 / malformed metadataはread時にrejectする。
- `README.md` は `npm run dev` を案内しているが、PowerShell の execution policy により `npm` ではなく `npm.cmd` が必要な環境がある。開発者向け手順へ Windows fallback を追記すると再現性が上がる。

## テンプレートの不足候補

`G:\devwork\tool-set\templates\new-web-service-project-start-kit` には discovery / product requirements / architecture / data contract / asset license / local AI feasibility / design QA の汎用テンプレートが揃っている。一方、次回 PJ の再利用性を上げるには次の汎用 template が未整備である。

1. Phase 1 star chart / weighted progress table（HTML + Markdown + machine validator）。
2. Browser music editor の capability matrix（note editor、mixer、export、MIDI、mobile fallback）。
3. Local AI gateway job contract（health / queue / artifact / VRAM cap / unload / fallback）。
4. Media export contract（WAV / stem / MIDI / project bundle の header / duration / provenance test）。

これらは本 PJ 固有のジャンル名、モデル名、secret を埋め込まない汎用 template として追加するのが適切です。

## 実行結果

```text
npm.cmd run lint             PASS
npm.cmd run typecheck        PASS
npm.cmd test                 PASS (14 files / 53 tests)
npm.cmd run build            PASS (Vite build; Basic Pitch split chunk)
npm.cmd run test:gateway     PASS (ephemeral gateway health/job/idempotency smoke)
npm.cmd run validate:progress PASS (16 units / total weight 100 / HTML synchronized)
npm.cmd run test:e2e         PASS (Chromium FHD 7 journeys; gateway calls use deterministic browser fixture)
dark visual QA               PASS (`npm.cmd run test:dark`; 1440/768/375 home + 1440 editor; overflow/console/network 0)
pwa preview QA               PASS (manifest / service worker scope / shell cache; Chromium; app registration calls observed before any QA fallback; install prompt remains external)
gateway fixture              PASS (health 200; accompaniment job 202 -> fallback complete)
gateway ACE-Step fixture     PASS (source-audio complete full-track 5.12 sec; artifact HTTP 200; 48 kHz stereo; peak reserved 9,622 MiB; source/reference deletion + unload after job)
gateway negative fixtures    PASS (origin 403; malformed JSON 400; profile 422)
```
