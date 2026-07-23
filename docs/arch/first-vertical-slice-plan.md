# First Vertical Slice Plan

## Decision

`Conditionally approved: deterministic fake composition slice only`

最初のsliceは「本人由来という設定の固定humming fixtureからmelody候補を受け取り、pitch / rhythmを
編集し、arrangement assetを交換し、undo / redoしてmanual project save / reloadできる」までとする。
音を鳴らすことやAI生成の品質ではなく、自作感を守る編集可能なproject正本を先に成立させる。

## User journey

1. `cute-future-bass-project.json`を新規projectとして開く。
2. 先頭の「曲の設計」で長さ、雰囲気、key、BPMと`cute-future-bass-arrangement.json`を確認する。AI固有promptとは別stateにする。
3. section内の開始小節と長さを選び、`HummingCapturePort`のcaptured fixture noteをその範囲へ表示する。
4. whole-song viewportでnote 1件のpitch / startをdragし、durationをresizeする。double-click addとDeleteも確認する。
5. arrangement候補を1回交換し、Bridge templateを追加・並べ替える。timeline conflictがあれば削除せず表示する。
6. `user-humming-asset.json`をreference-only assetとして関連付ける。
7. 直前3操作をundo / redoし、redo branch破棄も確認する。
8. manual save success fixtureでJSON bytesを生成し、reloadして同じsymbolic stateを得る。
9. save cancel、missing asset、unknown license、inference offlineを順に注入して編集継続を確認する。

## Build order

| Order | Deliverable | Acceptance |
| ---: | --- | --- |
| 1 | TypeScript domain types + validator adapter | 既存positive 3件pass、negative 3件intended fail |
| 2 | command history / revision state | project条件、pitch、timing、length、note add / delete、arrangement add / reorderのundo / redoとdirty規則をunit test |
| 3 | application ports + deterministic fakes | fake catalogのsuccess / cancel / timeout / offlineをcontract test |
| 4 | manual save / reload in-memory adapter | save成功後だけ`savedRevision`更新。cancelでdata loss 0 |
| 5 | semantic React workbench | Pastelの曲の設計 / 音 / 展開 / melody workspaceと、DOM property controls + Canvas viewportでjourneyを操作 |
| 6 | browser journey | 320 / 375 / 414 / 768 / desktop、keyboard、overflow、negative recovery |

## Acceptance scenarios

### Positive

- fixture load -> project foundation -> range humming notes -> Canvas pitch / rhythm edit -> arrangement replace / reorder -> save -> reload。
- 3 commandのundo / redo後にproject stateが期待snapshotと一致。
- saved revisionへ戻ったときだけdirtyがfalse。
- AI offlineでもtemplate / arrangement / melody edit / saveが完了。

### Negative

- malformed note、newer schema、traversalはload前またはadoption前にreject。
- missing assetはproject全体を破棄しない。
- unknown license assetはrender / public share / bundle / AI processingをdeny。
- save cancel / failureで`savedRevision`とuser editを失わない。
- duplicate inference job、timeout、malformed artifactをcandidateへ重複・混入させない。

## Explicitly outside this slice

- real microphone、Basic Pitch、AudioContext、speaker playback、WAV encode / download。
- ACE-Stepその他のreal model、home gateway、Cloudflare、account、secret、remote storage。
- BOOTH / Studio One / purchased assetの実file。
- X / Misskey実投稿。
- brand nameとoptional start screen。Pastel Patchboardはvisual directionとして採用済み。
- dependency install、app scaffold、deploymentはこのPhase 0文書作業では実行しない。

## Exit criteria

- domain / applicationがReactとlive adapterに依存しない。
- fakeと将来のlive adapterが同じport contractを使う。
- positive / negative / browser journeyがlocal commandで再現できる。
- production UI、real audio、real AIの未検証を完了と表現しない。
- 次のlive境界を1つずつ昇格でき、失敗してもfake / non-AI workflowへ戻れる。
