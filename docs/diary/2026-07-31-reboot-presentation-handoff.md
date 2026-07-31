# 2026-07-31 reboot presentation handoff

## 1. 結論

旧Phase 1は失敗判断後の比較資料として凍結した。sourceとGit履歴は削除していない。改変前の良質な設計・判断・prompt生成源は、bytes / SHA-256付きで[`docs/archive/2026-07-31-phase1-design-prompt-snapshot/`](../archive/2026-07-31-phase1-design-prompt-snapshot/README.md)へ退避済み。

新しい正本候補は`KASANE`。Web内でDAWを作り直すのではなく、1枚のLiving Scoreを聴きながら変えたい場所を指し、AI・鼻歌・手操作の音付き差分を比較して採用し、編集可能なままStudio One等へ渡す。

判断用入口: [`docs/reboot/kasane-presentation.html`](../reboot/kasane-presentation.html)

## 2. 新構想の正本候補

1. [`research-and-reuse-audit-2026-07-31.md`](../reboot/research-and-reuse-audit-2026-07-31.md) — 一次資料、失敗要因、keep / retire。
2. [`kasane-product-design.md`](../reboot/kasane-product-design.md) — Product promise、Living Score、対象ユーザー、非対象。
3. [`kasane-experience-architecture.md`](../reboot/kasane-experience-architecture.md) — semantic zoom、domain、audio、保存、mobile、build proof。
4. [`kasane-ai-change-contract.md`](../reboot/kasane-ai-change-contract.md) — scope / preserve付きのAI差分契約。
5. [`kasane-value-proposition.md`](../reboot/kasane-value-proposition.md) — appeal point、旧案との差、誠実な境界。
6. [`kasane-presentation.html`](../reboot/kasane-presentation.html) — 単体HTMLプレゼンとLiving Score概念モック。

## 3. Verification

- Snapshot manifest: 18 rows / 18 files、bytes / SHA-256再計算一致。
- HTML static: UTF-8 / `lang=ja` / viewport、duplicate ID 0、missing anchor 0、unnamed button 0、runtime error 0。
- Browser: system Chrome、1440×1000 / 768×1024 / 375×812。8 anchor、scene / depth / candidate、commit / reject、clip scope、snapshot / handoff、skip linkを確認。document overflow、console error、page error、request failureはいずれも0。
- `npm.cmd run check`: 33 test files / 150 tests、lint、typecheck、gateway smoke、build、progress、matrix pass。
- `git diff --check`: error 0。
- Browser screenshots: [`desktop`](../reboot/evidence/kasane-presentation-desktop-2026-07-31.png)、[`tablet`](../reboot/evidence/kasane-presentation-tablet-2026-07-31.png)、[`mobile`](../reboot/evidence/kasane-presentation-mobile-2026-07-31.png)。

## 4. User decision

次に必要なのは次の3点だけ。

1. `Living Score + Change Proposal`を次のProduct正本候補にするか。
2. Webの完成線を`DAW replacement`ではなく`composition + handoff`にするか。
3. 旧Phase 1を保持したまま、別entrypointで`Proof A: Living Score`を実装するか。

## 5. Stop line

KASANEはcandidateであり、まだ採用済み仕様ではない。回答前にproduction source、Project schema、外部AI、microphone、secret、課金、deploy、外部resourceを変更しない。stage / commit / pushも未実施。
