# KASANE AI Change Contract

Status: candidate / user presentation pending

## 1. Principle

AIは「曲を生成するendpoint」ではなく、「選択範囲に対して検証可能な変更案を返すcollaborator」である。

AI outputを直接Projectへmergeしない。必ず`ChangeRequest → ChangeProposal → validation → audition → commit`を通す。

## 2. ChangeRequest

```json
{
  "contractVersion": "0.1",
  "projectRevision": 42,
  "selection": {
    "sceneIds": ["scene-drop-1"],
    "roleIds": ["harmony", "bass"],
    "startTick": 15360,
    "endTick": 23040
  },
  "intent": {
    "goal": "Dropを明るく跳ねさせる",
    "energyDelta": 0.2,
    "density": "medium",
    "referenceWords": ["sparkling", "elastic", "wide"]
  },
  "preserve": {
    "melodyPitch": true,
    "melodyRhythm": true,
    "sceneLength": true,
    "manualEvents": true
  },
  "allowedOperations": [
    "replace-generated-notes",
    "change-chord-voicing",
    "change-instrument-role",
    "add-automation"
  ],
  "output": {
    "candidateCount": 3,
    "editableSymbolic": true,
    "audioPreview": true
  }
}
```

## 3. Prompt layers

Promptは1本のfree textにしない。

1. **System boundary** — operation allowlist、schema、license、no direct mutation。
2. **Project context** — tempo、key、time signature、scene / role graph、current harmony。
3. **Selection** — exact IDs / ticks、before events、adjacent context。
4. **User intent** — goal、emotion、reference、energy / density。
5. **Preserve contract** — melody、manual events、length、instrument等。
6. **Output contract** — operations、explanation、warnings、provenance。

UIには4〜6を人間向けに要約し、必要ならstructured request全体を開示する。

## 4. ChangeProposal

```json
{
  "proposalId": "proposal-01",
  "baseRevision": 42,
  "scopeDigest": "sha256:...",
  "summary": "Harmonyのvoicingを開き、Bassを裏拍へ移動",
  "operations": [
    {
      "op": "replace-generated-notes",
      "laneId": "lane-harmony-main",
      "startTick": 15360,
      "endTick": 23040,
      "events": []
    }
  ],
  "preservationChecks": {
    "melodyPitch": "unchanged",
    "melodyRhythm": "unchanged",
    "manualEvents": "unchanged"
  },
  "warnings": [],
  "provenance": {
    "route": "rule",
    "model": null,
    "seed": 731,
    "inputAssetIds": [],
    "license": "project-local"
  }
}
```

## 5. Validation

Proposalは次をすべて満たすまでpreviewにも入れない。

- base revision一致。
- selection外operationなし。
- allowed operationだけ。
- event ID、tick、pitch、duration、velocityがbounded。
- preserve条件違反なし。
- manual event削除なし。
- asset / model license metadataあり。
- unsupported device / effectをwarningなしで追加しない。
- outputが空、重複、malformedの場合は明示failure。

## 6. Audition contract

- before / candidateを同じplayhead、同じloop、同じcontext、同じpreview loudnessで鳴らす。
- candidate名に感情的な優劣を付けず、変更内容を記述する。
- candidate選択はProjectを変更しない。
- `部分採用`はoperation単位で行い、再validationする。
- commit時に1つのatomic commandとprovenanceを記録する。

## 7. Humming contract

Humming transcriptionは領域ごとにconfidenceを持つeditable proposalにする。

- pitch lock / rhythm lockを個別に選ぶ。
- low-confidence regionだけ再録音またはmanual editできる。
- chord adaptationは別proposalとして示す。
- 元take、normalized mono、transcription、applied notesを別identityで保持する。
- raw take保存とAI処理は明示consentを分ける。

## 8. Route policy

優先順位は品質とprivacyを含むcapability routingで決める。

1. deterministic local rule
2. browser local model
3. user-managed home model
4. explicit remote provider

外部routeへ進む場合だけ、送信data、provider、retention、costをcommit前に確認する。model名を毎回選ばせないが、routeは隠さない。

## 9. Error semantics

| Code | Meaning | Recovery |
| --- | --- | --- |
| `proposal-unavailable` | routeが利用不可 | local ruleへfallback |
| `scope-violation` | selection外を変更 | rejectしてrequestを狭める |
| `preserve-violation` | lock対象が変化 | rejectし、違反箇所を表示 |
| `malformed-response` | schema不一致 | current Projectを保持 |
| `partial-proposal` | role / artifact不足 | 部分previewまたは再生成 |
| `stale-revision` | base Projectが更新済み | rebase候補を作り直す |
| `license-unknown` | 出力利用条件不明 | export / shareをblock |

## 10. Instrumental boundary

初版はinstrumental / BGMを対象とし、生成条件へ次を固定する。

`Instrumental only. No vocals, no lyrics, no spoken words.`

ただし文字列だけに依存せず、output role allowlistにもvocal / lyric trackを含めない。
