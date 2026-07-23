# Docs Management Rules

## 原則

- 1ファイル1責務、正本は1つにする。
- `PROJECT.md` には恒久目的、scope、正本関係、採用済み判断だけを置く。
- 回答と発見状態は `docs/discovery/`、仕様は `docs/spec/`、Architectureは `docs/arch/`、デザインは `docs/design/` に置く。
- user判断、user作業、実装task、完了証拠は `docs/imp/` 内で分離する。
- 仮説は `仮説`、ユーザー回答は `回答`、観測済み事項は `事実`、未回答は `未決定` と明示する。

## 状態の流れ

`発見回答 → 要件候補 → 検証可能な要件 → Architecture候補 → 実装開始判定 → 実装task`

要件やArchitectureが未確定のまま、会話から直接実装taskへ飛ばない。

## 完了時

- 完了作業は `docs/imp/imp-comp.md` に成果物と検証結果を記録する。
- 未決事項は `user-judge.md`、ユーザー操作は `user-tasks.md`、実装待ちは `imp-tasks.md` に分ける。
- 横断再利用できるテンプレート変更は、個別PJの値を除いて `G:\devwork\tool-set\templates\` 側へ反映する。

