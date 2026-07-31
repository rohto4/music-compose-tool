# KASANE Experience Architecture

> 2026-08-01 V2 boundary: 最初のlocal Proof AはHero Kit、Living Score、決定論的Scene Move、same-point A/B、commit / undoだけを実装する。AI proposalとhumming inputは将来のoptional adapterであり、primary dependencyではない。受入正本は[`kasane-composition-desk-capability.md`](../spec/kasane-composition-desk-capability.md)。

Status: V1 architecture reference / V2 boundary above takes precedence

## 1. Surface model

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Transport · project · playhead · snapshot · export                  │
├──────────────────────────────────────────────────────────────────────┤
│ SCENE SPINE  Intro ━━━━━ Lift ━━━━━ Drop ━━━━━ Air ━━━━━ Final       │
├───────────┬───────────────────────────────────────────┬──────────────┤
│ ROLE      │ LIVING SCORE                              │ CHANGE DECK  │
│ Lead      │  clip A ── variation ───────────────      │ Before       │
│ Harmony   │  chord / texture weave ─────────────      │ A / B / C    │
│ Bass      │  motif ─────── motif ───────────────      │ Preserve     │
│ Rhythm    │  groove ━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │ Intent       │
│ Texture   │  air ───── riser ───── impact ─────      │ Commit       │
├───────────┴───────────────────────────────────────────┴──────────────┤
│ DEEP LANE — selected clip only; Phrase or Note detail               │
└──────────────────────────────────────────────────────────────────────┘
```

画面の所有者はLiving Scoreである。左navigation、Home、AI page、Humming page、DAW pageへ分割しない。

## 2. Semantic zoom

| Depth | User question | Visible objects | Hidden by default |
| --- | --- | --- | --- |
| SONG | どこで何が起きるか | scene、energy、role density、transition、main motif | individual note、device parameter |
| PHRASE | この数小節をどう変えるか | clip、chord、motif、groove、variation、sound role | plugin detail、全曲mixer |
| NOTE | この演奏をどう詰めるか | note、timing、length、velocity、automation | unrelated scene / role detail |

zoomはview stateであり、music dataを別schemaへ分けない。

## 3. Core domain

```text
Project
├─ MusicalGrid
├─ Scene[]
├─ Role[]
│  └─ Lane[]
│     └─ Clip[]
│        ├─ Event[]
│        ├─ VariationBranch[]
│        └─ Provenance
├─ Selection
├─ ChangeProposal[]
├─ CommandHistory
└─ AssetReference[]
```

### Scene

曲の時間範囲、energy curve、density target、transition intentを持つ。Intro等のlabelは任意metadataで、挙動を固定しない。

### Clip

note、audio、pattern、automationを同じ時間範囲へ束ねる編集単位。AI proposalと手編集はClip IDへ作用する。

### VariationBranch

同じselectionから派生したbefore / candidate / committed状態。branchはfull Project copyでなく、base revisionとoperationsを持つ。

### ChangeProposal

変更対象、保持対象、意図、提案operations、preview render、provenance、validation結果を持つ。Projectへ適用するまでimmutable。

## 4. Command flow

```text
gesture / text / humming
          │
          ▼
   Intent Normalizer
          │
          ▼
   Proposal Router ─── rule / template / local model / remote model
          │
          ▼
 Proposal Validator ── scope / schema / duration / collisions / license
          │
          ▼
  Preview Renderer ─── A/B/C same playhead and loudness
          │
      user commit
          ▼
  Project Command ─── undo / redo / branch / provenance
```

model routeはUIの中心にしない。ただしproposal detailから確認できる。

## 5. Audio Architecture

### Main thread

- React UI、selection、command dispatch。
- Canvas / DOMのvisible rangeだけを描画。
- audio scheduleのlook-ahead requestを送る。

### AudioWorklet

- transport clock。
- sample-accurate event queue。
- synth / sampler voice、gain envelope、meter。
- main thread stall時も現在bufferを安定再生。

### Worker

- OPFS project database。
- waveform / transient / pitch analysis。
- Offline render preparation。
- prompt / proposal validation。

### Offline render

- master / stems preview。
- proposal A/B loudness normalization。
- export artifact生成。

AudioWorkletの利用はcandidateであり、browser matrixと実測後に採用確定する。

## 6. Persistence model

### Working set

- OPFSへappend-only command journalとcontent-addressed asset blobを置く。
- compact Project snapshotを定期的に作る。
- site data消去で失われる境界を常時ではなくsave / closeの適切な箇所で明示する。

### User-owned snapshots

- `.kasane` bundle: project JSON、journal、asset manifest、optional media。
- Standard MIDI Type 1。
- master WAV / role stems。
- DAWproject: note、audio、automation、generic deviceから段階対応。

OPFSをautosaveの安心感には使うが、唯一の正本にはしない。

## 7. Proposal preview

- before / A / B / Cは必ず同じstart tickから再生する。
- proposal間でgain差を「良さ」に見せないよう、preview loudnessを揃える。
- selected range前後に短いcontextを含める。
- unselected roleは共通のcurrent Projectから鳴らす。
- candidate切替はProject historyを増やさない。
- commitだけが1 commandとしてhistoryへ入る。

## 8. Input convergence

| Input | Normalize to | Example |
| --- | --- | --- |
| Text | intent + constraints | 「Dropだけ明るく、melodyは残す」 |
| Humming | editable note proposal + confidence regions | rhythm lock、pitch adapt |
| Tap | onset grid / groove proposal | kick accent、syncopation |
| Drag | structural operation | scene length、clip move |
| Chord / pad play | captured harmonic event | replace selected harmony |
| Reference audio | feature vector + provenance | energy / texture only |

すべてselectionとpreserve条件を必要とし、Project全体へ暗黙拡張しない。

## 9. Mobile Architecture

mobileはcompanion viewを同じWeb app内で提供する。

- Scene Spineは縦のchapter list。
- roleはselectionしたscene内だけを5行で表示。
- Change Deckはbottom sheet。
- humming / tap capture、A/B、commit / undoをprimaryにする。
- NOTE depthはnumeric inspectorと短いpiano stripへ縮退する。
- heavy render / model unavailable時もrule proposalと既存variationを利用できる。

## 10. Accessibility

- transport、scene、role、clip、candidateをsemantic regionとして命名する。
- playhead positionとselectionは色だけでなくtext / outline / shapeで示す。
- A/B/Cはkeyboardで同じstart tickからauditionできる。
- drag operationにはmove before / after、scene変更等のbutton fallbackを持つ。
- motion reduction時はcandidate slide animationを停止する。
- screen reader向けにproposal operationsの要約を提供する。

## 11. Failure handling

| Failure | User-visible behavior |
| --- | --- |
| model unavailable | current Projectを保持し、rule proposalへrouteした理由を表示 |
| malformed proposal | applyせず、validation errorと再試行条件を表示 |
| partial tracks | missing roleを示し、利用可能部分だけのpreviewを許可 |
| audio underrun | transportを壊さず、quality modeを下げたことを通知 |
| quota / storage pressure | portable snapshotを先に案内し、削除対象を明示 |
| unsupported export feature | flatten / omit / cancelを項目別に選択 |
| permission denied | captureなしでもtext / pad / editで同じloopを継続 |

## 12. Build sequence

### Proof A — Living Score

static ProjectからSONG / PHRASE / NOTE semantic zoom、playback、selection、undoを作る。

### Proof B — Change Proposal

rule-based A/B/C、same-position audition、commit / reject / branchを作る。

### Proof C — Input convergence

text、tap、fake hummingを同じproposal contractへ通す。

### Proof D — Durable handoff

OPFS journal、portable bundle、MIDI / WAV / stems、minimal DAWprojectを作る。

### Proof E — Audio and real model

AudioWorklet hardening、実音源、local / remote modelを個別gateで追加する。

各Proofは前の体験を壊さず、外部modelなしでdemonstration可能にする。
