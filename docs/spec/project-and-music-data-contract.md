# Project and Music Data Contract

## 文書状態

`Candidate contract / Phase 0`

ユーザー回答で確定しているのはmanual save、project file、undo / redo、melody pitch / rhythmの優先編集、arrangement asset、生成・user assetである。拡張子、browser storage、tick resolution、bundle方式はArchitecture候補として定義し、vertical sliceでfixture検証後に採用する。

## Goals

- AI生成audioをproject唯一の正本にしない。
- 本人由来のhummingをmelody note / timingとして保持し、生成後にpitch / rhythmを編集できる。
- chordは理論fine editorではなく、候補・asset ID・key compatibilityとして保持する。
- arrangementの流れ、energy、transitionを交換可能なassetとして保持する。
- audio fileを安全に参照し、license / provenance / redistribution判断をprojectと一緒に残す。
- manual save、dirty表示、undo / redo、schema migrationを同じrevision modelで説明する。

## Candidate package

初版候補は`.mctproj` bundleで、内部は次の相対pathだけを持つZIPとする。ZIP実装は未採用で、最初のvertical sliceは同じ`project.json`を単独downloadしてよい。

```text
project.json
assets/<asset-id>.<validated-extension>
previews/mix.<validated-extension>       # optional
```

禁止:

- absolute path、drive letter、`..` traversal。
- secret、Access token、Cloudflare credential、home server path。
- user assetのlicenseがbundle再配布を許可していない場合の`assets/`同梱。
- temporary generation URLを永続project正本として保存すること。

JSON Schema:

- `schema/project-manifest.schema.json`
- `schema/asset-manifest.schema.json`
- `schema/arrangement-asset.schema.json`

正例・負例は`fixtures/`、依存なしのcross-field / trust-boundary検証は
`../../scripts/validate_phase0_contracts.py`に置く。これは完全なJSON Schema
engineではなく、schema自体の適用は実装用validator選定後にも行う。

## Time and melody representation

- `PPQ = 480`をcandidate defaultとする。MIDI import / exportと拍単位編集に十分で、sample単位編集は対象外。
- noteは`pitch`をMIDI 0–127、`startTick`と`durationTick`をnon-negative integerで表す。
- humming extractionの候補noteは`confidence`、`source=humming`、`userEdited`と、差し込み先`sectionId` / `rangeStartTick` / `rangeEndTick`を持つ。
- pitch / timing変更はnote単位commandとしてundo可能にする。
- tempo、meter、keyはproject metadataとして可変にするが、v1は先頭1 eventから開始できる。
- audio blockはtickへsnapするが、元音声のduration、sample rate、content hashをasset metadataへ残す。

## Progressive block granularity

次はprototype用仮説で、ユーザー採用済み値ではない。

| Mode | Default editing unit | Purpose |
| --- | --- | --- |
| `draft` | section / 8 bars前後 | 10分で流れと一部melodyを作る |
| `shape` | phrase / 4 bars前後 | 展開、instrument、FX候補を交換する |
| `detail` | whole-song viewport / melody note | 全曲をzoom / scrollしながらpitch / rhythmを洗練する |

Projectはblockを破壊的に細分化せず、parent block IDと派生blockを保持する。細分化後もsection単位の交換へ戻れる。

## Arrangement asset

Arrangement assetは完成曲ではなく、sectionの順、bar数、energy curve、transition slotを持つflow templateである。

- role候補: `intro`、`verse`、`build`、`drop`、`break`、`bridge`、`outro`、`custom`。`break`と`bridge`は同一roleへ畳み込まない。
- sectionごとに`energyStart` / `energyEnd`を0–1で保持する。
- section template追加と並べ替えはindex変更commandとしてundo可能にする。pointer dragはdomain上のreorder commandへ変換する。
- chord、drum、bass、synth、FXはsectionへ直接埋めず、role slotとcompatible tagで参照する。
- userがflowを変更した場合、melody noteはtimeline上に残し、衝突を明示して解決候補を出す。

## Asset and license boundary

すべてのaudio assetは`asset-manifest`を持つ。

| Origin | Default handling |
| --- | --- |
| `generated` | model / revision / seed / prompt constraintを記録。利用条件がunknownならcommercial / redistributionをunknownにする |
| `user-upload` | content hash、元file name、user assertion、source URL任意。licenseを自動推測しない |
| `user-owned-export` | Studio One等から書き出したfile。元product名とuser ownershipを記録するが、再配布許可とはみなさない |
| `template-pack` | pack ID / version / license IDを必須にし、許可されたrender / bundle範囲だけ使う |

license evidenceとeffective enforcementを分ける。evidenceは`redistribution`、
`commercialUse`、`derivativeUse`、`aiProcessing`とterms URL / digest /確認日を持つ。
enforcementは`renderAllowed`、`publicShareAllowed`、`bundleAllowed`、
`aiProcessingAllowed`を持つ。購入sampleを使ったrender済みmixを共有できても、
元sampleをproject bundleへ含めたりlocal AIへreferenceとして渡せるとは限らない。

Initial audio boundary:

- canonical import / internal render / exportはWAV PCM候補。48kHzへnormalizeする。
- browser microphoneのrecording MIMEは実行時検出し、AudioBufferへdecode後に正規化する。
- manual saveはBlob downloadをbaseline、File System Access APIはprogressive enhancementとする。
- Studio One / BOOTH等のassetは、exact terms不明ならprivate reference以外をdenyする。
- 詳細: `../research/audio-asset-format-and-license-boundaries-2026-07-21.md`。

## Generation candidate

AI jobのresultは採用前のcandidateとして保持する。

- `capability`、model / revision、seed、input asset IDs、requested intent、duration、status。
- `intentTrace`へ、humming、melody lock、mood、key、BPM、section等のどのconstraintを渡したか記録する。
- candidate audioを採用しても、melody / arrangement / chord / source metadataを消さない。
- failure / timeout / rejected candidateも、同一操作中は理由を表示できるが、永続projectへerror log全文やlocal pathを保存しない。

## Manual save contract

State values:

- `revision`: 作曲dataを変更するたびにincrement。
- `savedRevision`: 最後に明示download / overwriteへ成功したrevision。
- `dirty = revision != savedRevision`。

Rules:

1. 新規projectは`revision=0`、`savedRevision=null`。
2. Save操作でschema validation、asset availability、bundle policyを確認する。
3. download / write成功後だけ`savedRevision=revision`にする。cancel、permission denied、disk failureではdirtyを維持する。
4. autosaveはしない。browser crash recoveryをv1の保存保証として表現しない。
5. app close / navigation時はdirtyならwarning候補。browserが抑止する場合もあるため、成功保証にはしない。

## Undo / redo contract

Command対象:

- block add / remove / move / replace / split。
- melody pitch / timing / duration変更。
- arrangement flow / section length / transition変更。
- chord / instrument / FX candidate採用。
- creative intent、BPM、key等のproject変更。

履歴対象外:

- playback cursor、再生 / 停止、zoom、panel open、hover、candidate auditionだけの選択。
- model download、remote queue state、share dialog。

Rules:

- commandは`do` / `undo`に必要な最小patchとhuman-readable labelを持つ。
- 連続dragはpointer-up時に1 commandへcoalesceする。
- undo後の新規editはredo branchを破棄する。
- saveはundo historyを消さない。saved revisionへundoした場合dirtyはfalseになり、それより前へundoすると再びtrueになる。
- project load後のhistory復元はv1必須にしない。project data自体は常に復元できる。

## Validation and migration

- unknown top-level fieldはv1 loaderでerrorにし、silent data lossを避ける。
- newer major formatはread-only案内またはunsupported errorにする。
- same majorのmigrationはpure functionとして元fileを変更せず、新しいsnapshotを生成する。
- ID reference、timeline overlap、asset hash、path、duration、note rangeはJSON Schemaに加えdomain validatorで確認する。
- malformed file、ZIP bomb、too many entries、oversized uncompressed dataをnegative fixtureにする。

## Vertical slice acceptance

1. fixture projectをloadし、melody note 1つのpitchとtimingを変更できる。
2. arrangement assetを1回交換し、conflictを表示できる。
3. user audio assetをreference-onlyで追加し、hashとlicense unknownを保持できる。
4. 3操作をundo / redoでき、dirty / savedRevisionが規則どおり変わる。
5. manual saveしたJSONをreloadし、symbolic dataとasset referenceが一致する。
6. missing asset、unknown license、newer format、malformed note、save cancelでdataを失わない。

## Open decisions

- `.mctproj` ZIPをv1で採用するか、JSON + separate asset directoryから始めるか。
- audio exportのWAV / FLAC / AAC / MP3優先順位。
- browser working copyをmemoryだけにするか、manual save補助としてIndexedDBを使うか。
- project load後もundo historyを永続化するか。
- draft / shape / detailの正確なbar数。
