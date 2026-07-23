# Music Compose Tool Agent Instructions

## コンテキスト圧縮・再開時の最優先ルール

作業開始時、およびコンテキスト自動圧縮、セッション移動、handoff、要約コンテキストからの再開を検知した場合は、通常回答、作業継続、ファイル編集、外部書き込みより前に次をUTF-8でファイル実体から読む。

1. `AGENTS.md`
2. `PROJECT.md`
3. `tech-stack.md`
4. `README.md`
5. `docs/imp/user-tasks.md`
6. `docs/guide/implementation-context-reading-guide.md`
7. 現行作業に対応する `docs/imp/imp-tasks.md`、`docs/imp/user-judge.md`、`docs/imp/imp-comp.md` の対象見出し
8. handoffがある場合だけ該当する `docs/diary/*`

会話要約、memory、過去のチャットは補助情報であり、上記ファイル実体の代替正本にしない。

## 最優先ルール

1. 日本語で対応し、文書・設定・sourceをUTF-8として扱う。
2. 非自明な作業は着手時に `docs/imp/imp-tasks.md` へ目的、状態、完了条件、停止条件を記録する。
3. 完了した作業は `imp-tasks.md` から外し、成果物と検証結果を `docs/imp/imp-comp.md` へ残す。
4. 恒久目的と採用済み判断は `PROJECT.md`、仕様は `docs/spec/`、Architectureは `docs/arch/`、進行状態は `docs/imp/` に分離する。
5. 要件ヒアリングでは回答、根拠のある事実、仮説、未決定を混ぜない。ユーザーが答えていない内容を採用済み要件にしない。
6. UIの正本は、Hallmark案と独自案の比較後にユーザーが選ぶまで未決定とする。
7. 音源、ループ、画像、フォント等はライセンスと再配布条件を確認するまで本番素材として追加しない。
8. microphone、音声認識、外部API、認証、課金、remote作成、push、deploy、外部resource作成は別の明示承認なしに行わない。
9. 最初の実装はfake audio、fake voice transcript、固定clock・IDを優先し、successだけでなく権限拒否、unsupported、timeout、malformed、duplicate、保存失敗も検証候補にする。
10. 既存ファイルやユーザー変更を削除・上書きせず、差分を限定する。
11. 長い作業のunitまたは一まとまりを閉じるたび、chatの結果報告へ、そのunitで主語にした主要fileの絶対path linkと各fileの役割を付ける。会話logだけで成果物や正本を探させない。

## 現在のPhase 0境界

- 対象: PJ初期化、要件発見、要件・Architecture仮説、デザイン比較準備、再利用テンプレート改善。
- 非対象: アプリ機能実装、実音源生成、外部provider接続、依存導入、live E2E、公開。
- 実装開始条件: `docs/imp/implementation-readiness.md` の判定が `GO` または根拠付きの `条件付きGO` になること。
