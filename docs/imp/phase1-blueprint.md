# Phase 1 Local Production Blueprint

## Objective

Pastel Patchboardの操作をfake prototypeから実動作へ置き換え、requesting ownerがWindowsのWQHD / Full HD画面で、鼻歌を本人のmelodyとして保ちながら伴奏を組み、再生、編集、保存、再読込、WAV / stem / MIDI / project export、MIDI input、SNS投稿まで行えるlocal Web / PWAを完成させる。

## Final acceptance

1. 新規projectを作り、実際に音が鳴るassetを配置し、arrangementを編集できる。
1. Project Homeから`Humming Studio`または`Patchboard Workbench`を選び、別pageとして開始できる。
2. 30秒以内のhumming takeを録音し、Basic Pitchのnote候補へ変換し、本人のpitch / rhythmを保ったままchord / accompanimentを生成できる。
3. instrumentごとにmain / sub laneがあり、melodyと伴奏を個別trackとして編集できる。
4. note selection、pitch / timing drag、length resize、add / delete、multiple selection、copy / paste、loop、mixer、simple FX、automationが実動作する。
5. ACE-Step DiT-onlyを10,240MiB VRAM cap内でjobごとに起動し、生成WAVを追加audio layerとしてprojectへ採用できる。
6. browser内manual save、download可能project bundle、master WAV、track stem、standard MIDI exportとWeb MIDI inputが動作する。
7. X / Misskey share entrypointと投稿adapterを持ち、資格情報なしでは外部送信せず、安全に失敗する。
8. Windows Chrome / Edge相当のbrowser journey、domain / contract test、build、typecheck、static validationがpassする。

## Non-goals

- Windows native application。
- vocal / lyrics生成。
- MPE、external VST plugin、plugin editor。
- commercial plan / billing。
- offline-firstとautosave。
- Cloudflare Tunnel / public deployment。SNS post APIは対象だが、Web app自体のpublic hostingは対象外。
- Studio One専用container / preset / Sound Setの、licenseと公開formatを確認しない直接解析。

## Invariants

- `PPQ = 480`、AI audioはproject唯一の正本にしない。
- 鼻歌由来melodyのpitch / rhythmを既定でlockし、合わないchord側を変更する。
- manual saveだけを永続保存成功として扱い、dirty close warningを出す。
- 1 processのpeak reserved VRAMは10,240MiB以下。実測allowlist外profileを起動しない。
- external postはpreview、明示user action、対象host / account、credentialが揃うまで送信しない。secretをproject file、log、screenshotへ残さない。
- user-upload assetのlicenseを自動推測しない。Studio Oneはbounce WAV / MP3をbaselineとする。
- domain / applicationはReact、IndexedDB、Web Audio、microphone、MIDI、network adapterへ直接依存しない。
- progressは`docs/imp/phase1-progress.md`、完了証拠は`docs/imp/imp-comp.md`へ分離する。

## Cold-start reading order

1. `AGENTS.md`
2. `PROJECT.md`
3. `tech-stack.md`
4. `README.md`
5. `docs/imp/user-tasks.md`
6. `docs/guide/implementation-context-reading-guide.md`
7. `docs/imp/phase1-progress.md`
8. `docs/imp/imp-tasks.md`の`APP-001`
9. このblueprintの現在unit
10. 対象unitが参照するspec / Architecture

## Construction units

| ID | Weight | Outcome | Depends | Authority | Primary proof |
| --- | ---: | --- | --- | --- | --- |
| P1-FND | 5 | React / TypeScript / Vite scaffold、exact lockfile、test runner、manifest | Phase 0 | npm install許可済み | install、typecheck、build、smoke test |
| P1-DOM | 6 | production Project / Track / Lane / Note / Automation型、schema migration、command history | P1-FND | local write | positive / negative contract tests |
| P1-PRJ | 6 | project shelf、新規作成、IndexedDB manual save、dirty warning、`.mctproj` import / export | P1-DOM | local file download | create-save-reload-download E2E |
| P1-AUD | 8 | Web Audio realtime engine、asset audition、WAV / MP3 import、built-in synth / drums / FX | P1-DOM | microphone外のlocal audio許可済み | audible scheduling state、decode failure tests |
| P1-ARR | 6 | arrangement template、section add / reorder / remove、block配置、main / sub lane | P1-DOM | local | drag / keyboard journey、undo / redo |
| P1-HAR | 8 | humming-first harmonizer、chord / bass / drums / synth等の編集可能伴奏 | P1-AUD, P1-ARR | local | melody-lock fixture、deterministic song playback |
| P1-DAW | 11 | Canvas whole-song editor、P0+P1 note操作、range loop、track / lane edit | P1-DOM, P1-ARR | local | pointer / keyboard E2E、render budget |
| P1-MIX | 7 | volume、pan、mute、solo、tone swap、simple FX、automation lane | P1-AUD, P1-DAW | local | realtime / offline parameter tests |
| P1-MIC | 8 | real microphone、30秒take、retake / compare、Basic Pitch transcription | P1-DOM, P1-AUD | microphone / model許可済み | fake media tests + real permission observation |
| P1-INT | 6 | 別pageのHumming Studio、text / mood / spoken memo / reference audio、候補比較、自然言語refine、Patchboard handoff | P1-PRJ, P1-MIC, P1-HAR | local recording / import | full humming-first E2E、project round-trip |
| P1-AI | 8 | async localhost gateway、ACE-Step job、追加audio layer、unload、failure fallback | P1-INT, P1-HAR | local AI許可済み | health/job/artifact tests、VRAM evidence |
| P1-EXP | 8 | master WAV、track stem、MIDI、project bundleの実file export | P1-AUD, P1-MIX, P1-PRJ | local download | file header / duration / parse tests |
| P1-MIDI | 4 | Web MIDI device選択、live note audition、record to selected lane | P1-AUD, P1-DAW | browser MIDI permission | fake MIDI E2E + actual device待ち表示 |
| P1-PWA | 3 | installable manifest、desktop-first responsive、mobile degraded workspace、a11y | P1-FND, UI units | local | 320 / 768 / 1920 / 2560 viewport QA |
| P1-SHR | 2 | Web Share / X / Misskey adapter、preview、送信gate | P1-EXP, P1-PRJ | actual post許可済み、credential別gate | fake HTTP contract + live account確認待ち |
| P1-QA | 4 | full regression、browser QA、performance、failure recovery、docs evidence | all | local、live SNS以外 | required suite、browser report、completion log |

Weight total: `100`。scoreは実装量ではなく、unitのPrimary proofが揃い`verified`になったweightだけを加算する。

## Milestones

### M1: 2026-07-23 morning JST demo

「なんとなく音楽が作れる」最短経路を先に通す。

`P1-FND → P1-DOM → P1-AUD → P1-ARR → P1-HAR → P1-DAW basic → P1-PRJ → P1-EXP master`

Acceptance: 新規projectからbuilt-in音源でFuture Bass / Future Coreの短い曲を生成・再生し、melody noteを動かし、manual saveとmaster WAV downloadまで到達する。

### M2: Humming ownership

`P1-MIC → P1-INT Humming Studio → P1-HAR humming rerun → P1-DAW full`

Acceptance: 別pageのHumming Studioで30秒以内のtakeをnoteへ変え、鼻歌を守る伴奏・展開・FX候補を一曲として作り、自然言語で整えてPatchboardへ送れる。

### M3: AI additional layer

`P1-AI → P1-MIX → P1-EXP stem`

Acceptance: ACE-Step追加layerを生成、採用、mute / volume調整し、master / stemへ反映できる。

### M4: Production surface

`P1-MIDI → P1-PWA → P1-SHR → P1-QA`

Acceptance: desktop product journey、MIDI input、PWA、share、failure recoveryが検証済みになる。

## Risk-first decisions

- Basic Pitch packageは1.0.1で更新頻度が低いため、dynamic importとfallback transcriptionを分離する。
- ACE-Step DiT-onlyはtext-to-music fixtureだけがpassしている。鼻歌の厳密追従を主張せず、symbolic伴奏を先に保証する。
- Web Audio / OfflineAudioContextの差異を吸収するため、event planをdomainから生成しrealtime / offline adapterで共有する。
- actual Misskey postはinstance / token、X direct APIはdeveloper credentialが必要。adapter実装とlive E2Eを別statusにする。
- Studio One contentは個別license未確認。専用format direct importをcritical pathへ入れない。

## Recovery and handoff

- 各unitをbuild / test可能な状態で閉じる。commit / pushはユーザーが別途求めるまで行わない。
- 失敗したunitは`phase1-progress.md`へ観測、影響、次の安全な手段を記録し、依存しないunitを継続する。
- external credential待ちは`docs/imp/user-tasks.md`へ移し、実装全体をblockedにしない。
- 完了unitはprogressから削除せず`verified`へ変更し、証拠を`imp-comp.md`へlinkする。
- chatのunit完了報告は結果・検証・次unitを短く述べ、主要fileの絶対path linkと役割を必ず付ける。
