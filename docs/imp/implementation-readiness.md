# Implementation Readiness

## 現在判定

`GO: KASANE Composition Desk local Proof A`

2026-08-01の`JUDGE-023`で、鼻歌・生成AIをprimaryから外し、UIとasset品質を主戦場にするlocal実装が許可された。V2報告HTMLをproduction source変更前に再出力し、static gateとsystem Chrome 1440×1000 / 768×1024 / 375×812のinteraction / responsive gateをpassした。

実装正本は[`docs/spec/kasane-composition-desk-capability.md`](../spec/kasane-composition-desk-capability.md)。旧Phase 1のreadiness、UI、3入口、humming / AI capabilityは凍結履歴であり、この判定へ自動継承しない。

## 判定項目

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| Product job | 確定 | 調律済みの曲をscene単位で変え、自分の展開を短時間で作る |
| Core loop | 確定 | `KIT → PLAY → SHAPE → KEEP` |
| Primary UI | 確定 | Hero Kit、scene、5 role、Move Deck、transport、undoを1枚に置く |
| Music change | first proof確定 | versioned / deterministic `LIFT / STRIP / BOUNCE / ANSWER / BREAK` |
| Preview / commit | first proof確定 | same-point A/B、preview非破壊、atomic commit、1-step undo |
| Audio | localのみGO | user gesture後のbuilt-in Web Audio。外部sampleなし |
| Data | proof contract確定 | `HeroKit / Scene / Role / SceneMoveRecipe / CompositionState` |
| Entry boundary | 確定 | `/kasane`を追加し、旧Phase 1の`/`とProject schemaを保持 |
| Visual direction | V2採用 | report HTMLのComposition Desk。旧Pastel Patchboardを自動継承しない |
| External effects | 対象外 | microphone、外部AI、secret、課金、deploy、外部resourceなし |

## GO constraints

1. domain recipeはReact、browser API、clock、random、networkへ依存させない。
2. Proof Aは3 Hero Kit、5 scene、5 role、5 Scene Moveへ絞り、件数を品質の代理にしない。
3. external sample、画像、fontを追加しない。既存built-in synthesisとCSSだけで差を作る。
4. primary surfaceにAI / 鼻歌 / microphone controlを置かない。
5. scene外変更、unknown ID、duplicate commit、audio failureをfail-closedにする。
6. 旧Phase 1 source、Project schema、`/` entrypointを削除・置換しない。
7. focused test、全project check、system Chrome 3 viewportをpassするまで完了と表現しない。
8. browser proofを音楽的魅力、完全なaccessibility、cross-browser品質の証明にしない。

## Proof Aをblockしない将来項目

- user実耳による3 Hero Kitと全Scene Moveの主観品質評価。
- Chrome以外のFirefox / WebKit、実smartphone、長時間sessionのlatency / battery。
- MIDI / WAV / stems / DAWprojectの新UIからの実handoff。
- portable snapshotと既存`.mctproj`の統合。
- optional humming / AI adapterの再評価。

## Hard stop

license不明asset、外部AI、microphone実動作、account、credential、public deploy、Cloudflare resource、actual SNS postへ進む場合は、対象ごとの新しい明示承認とreadiness更新が必要。
