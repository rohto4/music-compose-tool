# Music Compose Tool reboot

Status: **V2 direction adopted / local Proof A in progress**

Started: 2026-07-31

旧Phase 1は失敗判断後に凍結した。2026-08-01の`JUDGE-023`で鼻歌・生成AIをprimaryから外し、UI、少数精鋭asset、決定論的Scene Moveを攻めるV2方針へ更新した。

## Read in this order

1. `kasane-presentation.html` — V2方針を短時間で判断する単体HTMLプレゼン。
2. `../spec/kasane-composition-desk-capability.md` — 採用済みProof Aの受入契約。
3. `research-and-reuse-audit-2026-07-31.md` — なぜ失敗したか、何を残すか。
4. `kasane-product-design.md` — V1設計とV2決定追記。
5. `kasane-experience-architecture.md` — architecture候補。AI routeは最初のproofから外す。
6. `kasane-ai-change-contract.md` — 将来のoptional AIだけに適用する差分契約。
7. `kasane-value-proposition.md` — ユーザーにとっての魅力と、既存Web DAWとの差。

## Browser evidence boundary

- [`1440×1000`](evidence/kasane-presentation-desktop-2026-07-31.png)
- [`768×1024`](evidence/kasane-presentation-tablet-2026-07-31.png)
- [`375×812`](evidence/kasane-presentation-mobile-2026-07-31.png)

上記画像は2026-07-31のV1 evidenceであり、V2の見た目を示さない。V2 HTMLは2026-08-01にスクリーンショットなしで1440×1000、768×1024、375×812のanchor、Kit / Move interaction、responsive layout、document横overflow、console / page / request error、keyboard最初のskip linkを再確認した。新しい画像は必須実装完了後だけ取得する。

## State boundary

- `KASANE`はcodename、Composition Desk local Proof Aは採用済み実装範囲。
- production sourceは`/kasane`の別entrypointへ追加し、旧Phase 1の`/`と既存Project schemaを壊さない。
- 外部AI、microphone、license不明sample、secret、課金、deploy、外部resourceは変更しない。
- 旧設計source snapshot: `../archive/2026-07-31-phase1-design-prompt-snapshot/`。
