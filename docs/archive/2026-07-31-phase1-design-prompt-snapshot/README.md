# Phase 1 design / prompt source snapshot

Snapshot date: 2026-07-31

Source branch: `main`
Source commit before reboot documents: `35416702926ebdea93ed465ef7590092e150e845`

## Purpose

2026-07-31にユーザーが現行Projectを一旦失敗と判断したため、再設計前のうち再利用価値がある設計、意思決定、Architecture、AI向けprompt生成源だけを改変前のまま退避した。

このsnapshotは旧Phase 1の継続指示ではない。新構想へ機械的に移植せず、採用理由が新しいProduct原則と一致するものだけを再評価する。

## Preserved boundaries

- 利用者が音楽理論やDAW操作を熟知していなくても、自分の意図を短時間で鳴らせるという恒久目的。
- AIのflat audioだけを正本にせず、編集可能なProject / Track / Lane / NoteEventを保持する考え方。
- AI変更の対象範囲、入力条件、fallback、provenanceを明示する考え方。
- Web / PWA、mobile縮退、manual save、Standard MIDI / WAV / stems / project bundleによるportable handoff。
- microphone、外部AI、license、secret、deploy、実機確認をlocal proofから分ける安全境界。
- Instrumental-only Creative Brief、構造化JSON、コード譜等を同じProjectから生成するprompt contract。

## Explicitly not copied

- 現行UIのscreenshot、visual evidence、Phase 1進捗表。
- `node_modules`、build artifact、model、audio asset、録音、credential。
- component実装全体、CSS、旧screen構成。
- 音色数やfeature数を目的化したcatalog一式。

旧sourceとGit履歴は元の場所に残る。このsnapshotは「残す理由が説明できる設計source」だけを読むためのcurated入口である。

## SHA-256 manifest

| Snapshot-relative path | Bytes | SHA-256 |
| --- | ---: | --- |
| `source/PROJECT.md` | 19096 | `29d9c6f9d74be361d5cf8b00f64eef4ecb6b9fffe8c269f749dcd96d603eed58` |
| `source/tech-stack.md` | 16452 | `5fee39d53867736543933f1000cedbdbf3414ee3d89619440b88ad25c88618c2` |
| `source/docs/discovery/project-discovery.md` | 6008 | `d2e7edc091d82b5645e40f889ba42327ca2055d0dd1d230a0b877dd070f21a1e` |
| `source/docs/spec/product-requirements.md` | 22024 | `49b52177ef154eb1094dd8add5a003e6b595d7b3db145f4c8ab37db954ab45f4` |
| `source/docs/spec/project-and-music-data-contract.md` | 9521 | `1589d019af87d48b1d6f4c00840943ed7cf90de45f9c530284d0b01678a57ec4` |
| `source/docs/spec/fake-boundary-and-negative-scenarios.md` | 5355 | `edd49a2427107076f26ee8144220bee998117d5ca017c4b9faf431b59216362d` |
| `source/docs/spec/schema/v1/project-manifest.schema.json` | 12343 | `ba6639740c7d4e0af6bf141639c848210ede159d56d0136cf20ff54573de5892` |
| `source/docs/arch/system-context.md` | 4607 | `ba46a36191bd4c75bab30b92b358c4f63fa7337feb520036d4c1e1a3399814a4` |
| `source/docs/arch/web-application-stack.md` | 4220 | `f07b304424ba483a67537f30e0ed49b2c98d88255211345e150871dbac9409a0` |
| `source/docs/arch/pattern-board-foundation.md` | 13961 | `d070e00f0784c082e6cff4c4934832942181533083cc157f0d36cc029488fb43` |
| `source/docs/arch/home-model-serving-topology.md` | 8368 | `f4898d2657f1758c3662989b85c3b434082eb84ca026e81c6a3b0eed5eed1593` |
| `source/docs/design/design-directions.md` | 10396 | `14b9b98fad148a11ee2edb185d7a860bd223541314a775831fc199c742fa6153` |
| `source/docs/imp/user-judge.md` | 29385 | `ee4778e429f7841116b76b6d1c1f677e43a6bfb44aa287b4dd4ac3cd2dd5910b` |
| `source/docs/research/composition-workflow-prompt-and-score-formats-2026-07-23.md` | 6521 | `9b3417a4fa03bf06ba2b579a4393d71cc6891694305a9eca8d3db572d760a88a` |
| `source/docs/research/audio-asset-format-and-license-boundaries-2026-07-21.md` | 13055 | `ce8aa66d4c79a73eb15158cfa5cfebbe494536391166a8a190d853b9064d6532` |
| `source/docs/research/music-ai-model-landscape-2026-07-21.md` | 18631 | `5d12810160d680c29e754d59a2b8944fa002a1f391e222b0a48c3d4cb87e0499` |
| `source/src/application/projects/creative-brief.ts` | 13259 | `e1d155aac8fe155e2ebb037ab7bbd906406c27f6d8e5e41f96afe55da1e0b9fc` |
| `source/src/domain/music/ai-starter.ts` | 1825 | `b887d0f15c2ede14cbcd8c6950f5bce20ffbf28e5e29db8d08c8e01f4d3fee96` |

退避時に18 / 18 fileで原本とcopyのSHA-256一致を確認した。
