# Implementation Context Reading Guide

共通初期化後、現在の役割に対応する最小範囲だけを追加で読む。

## 要件発見

1. `docs/discovery/project-discovery.md`
2. `docs/spec/product-requirements.md` の未決箇所
3. `docs/imp/user-judge.md` の該当項目

## デザイン比較

1. `docs/design/design-directions.md`
2. `docs/design/brand-identity/state.json` と進行中module
3. `docs/spec/product-requirements.md` の主要workflowとtarget device
4. Hallmark案の場合だけ `docs/candi-ref/hallmark-adoption.md` と指定されたHallmark reference

## Architecture・実装準備

1. `docs/spec/product-requirements.md`
2. `docs/arch/system-context.md`
3. `docs/imp/implementation-readiness.md`
4. `tech-stack.md`

## 実装

`docs/imp/implementation-readiness.md` が `GO` または根拠付きの `条件付きGO` でない限り開始しない。対象componentの要件、受入条件、fake境界だけを読み、未採用候補を実装前提にしない。

## Phase 1機能進捗の確認

機能単位でUI、実装・データ、動作確認、テスト、運用・外部gateを横断するときは、`docs/imp/phase1-feature-progress-matrix.html`を読む。これはP1ユニット完成度の`phase1-progress.html`とは別のマトリクスであり、ローカル実装の完了と、実機・実アカウント・ライセンス確認を混同しない。セルの星はレビュー用のlocalStorage評価で、正本・コード・証跡の代替ではない。星の定義は、★3=AIが自律確認できた状態、★4=ユーザーのブラッシュアップ完了、★5=AIの最終調整完了。UI / 操作はユーザー確認前の★3で止める。★3は黄色、★2以下は赤で表示する。
