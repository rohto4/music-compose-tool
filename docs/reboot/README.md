# Music Compose Tool reboot

Status: **candidate / user presentation pending**

Started: 2026-07-31

旧Phase 1は失敗判断後に凍結した。ここは既存画面の改修計画ではなく、新しいWeb Compose Productをゼロベースで判断するための提案領域である。

## Read in this order

1. `research-and-reuse-audit-2026-07-31.md` — なぜ失敗したか、何を残すか。
2. `kasane-product-design.md` — 新Productの目的、主体験、scope。
3. `kasane-experience-architecture.md` — 画面、interaction、data、audio、保存、handoff。
4. `kasane-ai-change-contract.md` — AIが曲を壊さず提案する契約。
5. `kasane-value-proposition.md` — ユーザーにとっての魅力と、既存Web DAWとの差。
6. `kasane-presentation.html` — 上記を短時間で判断する単体HTMLプレゼン。

## Browser evidence

- [`1440×1000`](evidence/kasane-presentation-desktop-2026-07-31.png)
- [`768×1024`](evidence/kasane-presentation-tablet-2026-07-31.png)
- [`375×812`](evidence/kasane-presentation-mobile-2026-07-31.png)

Chromeでanchor、concept interaction、responsive layout、document横overflow、console / page / request error、keyboard最初のskip linkを確認した。これは完全なWCAG監査や音源付きprototypeの証拠ではない。

## State boundary

- `KASANE`はcandidate codename。
- ここに書かれた内容は、ユーザーがプレゼン後に選ぶまで採用済み仕様ではない。
- production source、既存Project schema、外部service、旧UIを変更しない。
- 旧設計source snapshot: `../archive/2026-07-31-phase1-design-prompt-snapshot/`。
