# Implementation Readiness

## 現在判定

`GO: Phase 1 local production implementation / external live gate分離`

- source template: `G:\devwork\tool-set\docs\setting\new-web-service-implementation-readiness-template.md`

2026-07-22のユーザー回答で、production dependency導入、実microphone、Basic Pitch、local AI、local dev server、
WAV / MIDI / project export、SNS投稿adapterまでのPhase 1実装が明示許可された。Cloudflare経由のWeb app公開、
credentialを使うactual SNS post、actual MIDI device、license未確認assetだけを別live gateとして分離する。
1 process peak reserved VRAM 10,240MiB hard cap、manual save、secret非保存等の制約は継続する。

## 判定項目

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| 主要利用者とjob | 確定 | personal-first、humming由来のオリジナルBGM |
| 主要workflow | first slice確定 | pitch / rhythm編集、arrangement交換、undo / redo、manual save / reload。`docs/arch/first-vertical-slice-plan.md` |
| 受入条件 | first sliceは検証可能 | positive / negative / browser journeyを定義。10分・60分のProduct KPIは実測待ち |
| System Context | 仮説 | `docs/arch/system-context.md` |
| data・file format | Candidate contract作成済み | PPQ 480 note / timing、arrangement flow、asset manifest、`.mctproj`候補、manual save / undo契約。`docs/spec/project-and-music-data-contract.md` |
| microphone・voice境界 | local production検証済み | MediaRecorder最大30秒、take比較、raw Blob private保存、Basic Pitch音符化 |
| audio・sample license | Candidate boundary作成済み | WAV PCM、Studio One bounce、BOOTH個別規約、render / share / bundle / AI processing分離。`docs/research/audio-asset-format-and-license-boundaries-2026-07-21.md` |
| Web stack | first slice採用 | TypeScript strict、React 19.2系、Vite、npm lock、Vitest、Playwright。`docs/arch/web-application-stack.md` |
| Music AI landscape | 一次資料比較済み | 14系統を比較し部分採用shortlistを作成。`docs/research/music-ai-model-landscape-2026-07-21.md` |
| Local model runtime | 一部実測済み | ACE-Step DiT-onlyはpeak reserved 7,504MiBでallowlist。1.7B LM thinkingは14,128MiBでcap超過・不採用。長尺、humming、他modelは未検証 |
| Home inference relay | Architecture候補 | Access + Tunnel + custom async gateway候補。Cloudflare / domain / live E2Eは未実施 |
| fake境界・negative scenarios | first slice採用 | 9 effect port、18 negative scenario、canonical error、live promotion gate。`docs/spec/fake-boundary-and-negative-scenarios.md` |
| デザイン比較 | Pastel Patchboard採用・phase refinement済み | 4 surface x 5 viewport、project foundation、範囲humming、Bridge / drag、1 tap試聴、whole-song Canvas editorを含むPastel 44操作を検証。`docs/design/prototypes/browser-qa-report.md`、`JUDGE-002` |
| 精密editor描画 | Prototype Architecture採用 | PPQ 480 + Canvas 2D + viewport culling + Pointer Events。Studio One内部rendererは未公開。OffscreenCanvas / WebGL / WebGPUは実測昇格。`docs/research/precision-music-editor-rendering-architecture-2026-07-21.md` |
| 外部作用 | localのみGO | actual SNS post / Cloudflare / secret / public resourceは別gate |

## Phase 1 GOの制約

1. `src/domain`と`src/application`はReact、browser API、live adapterへ依存させない。
2. local browser adapterはcontract testとbrowser observationを揃えて1境界ずつ昇格し、network / credential境界はfakeを既定にする。
3. 既存JSON schema / fixture / validatorを変更する場合、positiveとnegativeを同時に更新する。
4. UIはPastel Patchboard tokenとphase別full-screen workspaceを採用する。Hallmark tokenを混在させず、prototype HTMLをproduction appと表現しない。
5. project-wideな長さ・雰囲気・key・BPMと、AI固有のprompt / reference /生成範囲をdomain / UIで分離する。
6. dependencyはexact versionとlockfileを維持し、license noticeとproduction buildを検証する。
7. microphone / local AIは許可済み。public deploy、secret、account、external resource、actual postは別gateとする。

## Production GOをblockする項目

- actual browser / device matrix。特にiOS WebKit、Android Chrome、Windows Chrome / Edge。
- Web Audio schedulerとWAV / MP3 importはChromeでpass。OfflineAudioContext render / downloadとcross-browser latency。
- Basic Pitchは実modelで4音fixtureを音符化済み。noise、歌声、mobile browser、主観的なhumming追従品質。
- ACE-Step等のsubjective genre fit、長尺、reference / repaintと残りmodel capability実測。
- Studio One / BOOTHの対象content単位のlicense確認と実asset validation。
- home gateway / Cloudflare identity / retention / live E2E。
- X / Misskeyのactual share contract。

これらはfirst fake sliceをblockしないが、該当live capabilityを完成・公開と表現することをblockする。
