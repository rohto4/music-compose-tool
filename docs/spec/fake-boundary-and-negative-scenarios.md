# Fake Boundary and Negative Scenarios

## Status

`Adopted contract for the first vertical slice`

最初の実装では、作曲domainとerror recoveryを実装対象にし、microphone、real audio、AI、file write、
external share、home serverをdeterministic fakeの外へ出さない。fakeで成功だけを返さず、拒否、timeout、
malformed、duplicate、cancelを同じport contractで再現する。

## Effect ports

| Port | First implementation | Fixed input / output | Must not do |
| --- | --- | --- | --- |
| `ClockPort` | fixed clock | `2026-07-21T00:00:00Z` | system clock参照 |
| `IdPort` | sequence ID | fixtureで定義したID列 | random UUID生成 |
| `HummingCapturePort` | fixture selector | captured / denied / unsupported / empty | microphone permission要求 |
| `MelodyExtractionPort` | fixture notes | valid notes / malformed note / timeout | model download、DSP実行 |
| `InferencePort` | state machine | queued / running / succeeded / failed / offline | network、GPU、home gateway接続 |
| `AssetReadPort` | metadata fixture | found / missing / hash mismatch / denied | local file scan、upload |
| `ProjectFilePort` | in-memory byte sink / source | save success / cancel / write failure / malformed load | browser download、disk write |
| `AudioPreviewPort` | logical transport | playing / stopped / unavailable | AudioContext作成、speaker出力 |
| `SharePort` | copy draft result | X / Misskey draft / unavailable | window popup、external post |

UIは各fake状態を`Demo / external effectなし`と表示する。production codeでfakeとliveを環境変数だけで
暗黙切替せず、composition rootで明示的にadapterを選ぶ。

## Canonical error shape

```json
{
  "code": "MCT_SAVE_CANCELLED",
  "category": "permission | unsupported | invalid-input | unavailable | timeout | conflict | internal",
  "retryable": false,
  "userMessageKey": "save.cancelled",
  "details": {},
  "cause": null
}
```

- user-facing stateは`code`から決め、raw exception text、local path、token、provider responseを表示しない。
- `details`はfixture ID、field path、expected / observed等の非secret値だけを持つ。
- cancel、permission denied、validation failureを`internal`へまとめない。
- retry可能でも無限自動retryしない。

## Negative scenario catalog

| ID | Boundary | Injection | Expected invariant |
| --- | --- | --- | --- |
| NEG-001 | project load | newer major schema | original bytesを保持し、silent downgradeしない |
| NEG-002 | project load | malformed note pitch / duration | projectを採用せず、field pathを返す |
| NEG-003 | project load | `..` / absolute asset path | traversal error。root外を読まない |
| NEG-004 | asset | missing reference | symbolic projectを開き、placeholder / relink状態にする |
| NEG-005 | asset | unknown license | private reference以外のrender / share / bundle / AIをdeny |
| NEG-006 | asset | hash mismatch | assetをquarantineし、再生・AI入力に使わない |
| NEG-007 | humming | permission denied fixture | melodyを上書きせず、他の編集を継続できる |
| NEG-008 | humming | unsupported / empty fixture | 明示理由を示し、同一結果のclick fallbackは約束しない |
| NEG-009 | extraction | timeout | current melodyを維持し、candidateを未採用にする |
| NEG-010 | extraction | malformed notes | validatorでrejectし、partial noteを混入させない |
| NEG-011 | inference | server offline / queue full | non-AI workflowを継続し、edit stateを失わない |
| NEG-012 | inference | duplicate idempotency key | job / candidateを重複追加しない |
| NEG-013 | inference | failed / malformed artifact | artifactをpublish / adoptせず、retryかfallbackを提示 |
| NEG-014 | save | user cancel | `savedRevision`を更新せずdirtyを維持 |
| NEG-015 | save | write failure | in-memory projectとundo historyを維持 |
| NEG-016 | undo / redo | undo後の新規edit | redo branchだけを破棄し、save revision規則を保つ |
| NEG-017 | arrangement | flow交換でmelody conflict | melodyを削除せず、conflictを構造化して表示 |
| NEG-018 | share | popup / provider unavailable fixture | external effect 0。export済み音声への入口だけを維持 |

## Determinism

- fixtureはfixed clock、fixed ID、fixed note、fixed arrangement、fixed job transitionを使う。
- testはwall clock、network、GPU、microphone、speaker、random seedへ依存しない。
- fake latencyはtest schedulerで進め、実時間sleepを使わない。
- failure fixtureは1件につき主な失敗理由を1つにする。

## Contract tests

各portは同じtest suiteをfakeと将来のlive adapterへ適用する。

1. request / response schemaを満たす。
2. cancel / timeout / unsupportedをcanonical errorへ変換する。
3. duplicate requestのidempotency規則を満たす。
4. failure時にproject revision、dirty、undo stackを壊さない。
5. raw secret、absolute path、provider payloadをdomain errorへ漏らさない。

## Live promotion gate

個別portをliveへ置き換える前に、対象portのcontract test、negative fixture、permission UX、resource limit、
retention、security boundaryを通す。他portのfakeを同時にliveへ昇格させない。

