# Project Discovery: Music Compose Tool

## 状態

- session: `music-compose-tool-discovery-2026-07`
- status: `in_progress`
- current module: `Purpose / Why`
- interview style: 1回に1問。回答後に要約し、必要な場合だけ深掘りする。
- source template: `G:\devwork\tool-set\docs\setting\new-web-service-project-discovery-template.md`
- question plan: `docs/discovery/question-backlog.md` のコア20問＋条件付き最大10問
- normalized answers: `docs/discovery/core-question-answers.md`
- normalized follow-ups: `docs/discovery/follow-up-answers.md`

## 回答として受け取った事実

- DTMのように1音ずつ入力するのではなく、まとまった音のセットをパズルのように配置したい。
- クリック中心で、少しのボイス入力も使いたい。
- smartphone対応が必要。
- 最初は「かわいいFuture Bass」と「かわいいFuture Core」を作れるようにしたい。
- ドラム、FX、和音、シンセ等の音セットを切り替えたい。
- 時間目標は10分、30分、1時間の3段階。
- WebサイトまたはWindows native toolのどちらかを候補にしている。
- Hallmark案とHallmarkを使わない案を比較してからデザイン正本を選びたい。
- GitHub repositoryは `https://github.com/rohto4/music-compose-tool.git`。
- 最初の利用者はユーザー本人。
- 音楽理論・chord知識はほぼなく、electone・合唱経験、Studio One約3か月の使用経験があるが、1曲を完成した経験はない。
- vocal / lyricsではなくinstrumental / BGMを作る。
- Web / PWAを採用し、Windows nativeは不要。
- smartphoneでも新規作成、途中編集、試聴、共有のfull workflowを求める。
- autosaveとofflineは不要で、manual save、undo / redo、project fileが必要。
- 音源は生成とuser uploadを想定し、BOOTH等で入手したassetを取り込みたい。
- 初版ではcommercial versionとtone/sound自作機能を作らない。
- 曲作りの多くはAIへ任せてもよい。
- 本人が入力したhummingや「こういうイメージ」という指示は、生成結果へきちんと採用される必要がある。
- AI生成後の自由度、特に編集性能を高くしたい。
- 最優先の手編集対象はmelodyのpitchとrhythm。
- chordの直接編集需要はなく、自動生成またはasset配置でよい。
- 曲構成には、最初からある程度の流れを持たせ、流れ・展開のassetを選びたい。
- instrumentは多くの音源が必要。所有するStudio One製品の資産流用または自動生成が候補。
- FX / mixの専門操作より、voice memoで雰囲気を伝える方法または選択式を求める。
- 残りの質問より先に、music generation、generation補助、sound source生成へ使える公開modelの有無とfitを調査したい。
- fitするmodelだけを部分採用し、不足部分は従来のWeb実装、logic、template、assetの選択肢で補いたい。

## 仮説

- H-001: 最初の利用者は、曲を作りたいがDAW/音楽理論の学習コストを避けたい個人利用者。
- H-002: 中心価値は、選択肢を絞って早く「曲らしい結果」へ到達した後、本人が重視する箇所だけ深く編集できること。
- H-003: テンプレートの単位は、単発sampleよりも小節・section・役割を持つ互換ブロックに近い。
- H-004: voiceは長文会話より「もっとかわいく」「サビを強く」等の意図指定に向く可能性がある。
- H-005: 本人由来のhummingをmelodyのseedにし、AIは伴奏・補正・候補提示を担うと自作感を保ちやすい可能性がある。
- H-006: 30分は独立した品質gateではなく、10分から60分への中間checkpointとして扱える可能性がある。
- H-007: 自作感は人間が作業した割合より、本人のhumming・イメージ指示への追従度と、生成結果の編集可能性に強く左右される可能性がある。
- H-008: 最初のvertical sliceは、hummingから抽出したmelodyのpitch / rhythm編集を中心にし、chordは候補再生成・asset差し替えに寄せられる可能性がある。
- H-009: arrangementの「展開asset」は、Intro / Build / Drop等のsection順だけでなく、energy curveやtransition patternを持つblockになる可能性がある。

仮説は回答ではなく、質問選択のためだけに使う。

## 発見module

1. Purpose / Why
2. Audience / existing skill
3. First successful outcome
4. Core workflow and control depth
5. Time-based quality bar
6. Non-goals
7. Platform and environment constraints
8. Voice role and privacy
9. Save / export / share
10. Tone and design comparison gate

各moduleの具体質問と適応条件は `docs/discovery/question-backlog.md` を正本にする。全問を一括質問せず、既知回答で閉じられるものは省略する。

## 現在の質問

`PAUSED: model landscape調査を質問より先行する。再開点はF-004 Probe 2b。`

一次資料によるmodel landscapeは`docs/research/music-ai-model-landscape-2026-07-21.md`へ保存した。model downloadとlocal実行は別承認に分ける。

## 未決定

- 2番目に優先する対象と、意図が「採用された」と判定する基準。
- FXのvoice memoがspeech、口真似、参考audioのどれを意味するか。
- Studio One製品資産のformat、license、export方法とWeb/PWAへのimport可否。
- 以前の制作で最も止まった具体的な操作。
- speechで行いたい具体的command。
- shortlist modelのlocal fixture実測と、最終的なmodel採否・接続方式。
- blockの具体的bar数と段階別編集単位。
- audio / project export formatとMisskey share仕様。
- uploaded assetのlicense metadata、保存、project共有時の扱い。
- account、cloud sync、accessibility、対応browser/device。
