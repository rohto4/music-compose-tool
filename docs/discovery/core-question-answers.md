# Core Question Answers

## Metadata

- source: ユーザー回答（2026-07-21）
- questionnaire: `docs/discovery/question-backlog.md`
- status: コア20問を一括回答済み。17問complete、3問partial。
- normalization rule: 回答内容と解釈を分離し、未回答部分を勝手に補完しない。

## Q-001 Purpose / Why

- type: `ANSWER`
- answer: オリジナルの可愛いFuture Bass / Future Coreを自作した実感がほしい。ワンフレーズでも自分のオリジナリティが出た体験を重視する。
- key evidence: 定型patternを並べるだけでは自作感が薄い。鼻歌を本人由来のmelody inputにし、伴奏を付けたい。
- status: complete
- follow-up: `F-004`でAI補助と自作感の境界を深掘り中。
- follow-up result: AIへの広い委任は許容するが、本人のhumming・イメージ指示への追従と生成後の編集可能性を重視する。詳細は`docs/discovery/follow-up-answers.md`。

## Q-002 Primary audience

- type: `ANSWER`
- answer: 最初に満足させる利用者はユーザー本人。
- status: complete

## Q-003 Existing knowledge

- type: `ANSWER`
- answer: 音楽理論とchord知識はほぼない。electoneと合唱経験があり、Studio Oneを約3か月使用したが1曲を完成した経験はない。
- status: complete

## Q-004 Current situation

- type: `ANSWER`
- answer: 現在は制作しておらず、諦めている状態。
- status: partial
- unknown: 以前の制作で最も時間を失った、または止まった具体的な操作。

## Q-005 Reference outcome

- type: `ANSWER`
- answer: 『ブルーアーカイブ』の楽曲のような可愛いFuture Bass系を目標にし、ミツキヨ、Nor、KOTONOHOUSE、Yunomi等の楽曲を好む。
- interpretation: 特定作品やartistの複製ではなく、後続調査でrhythm、sound palette、energy、section、texture等の属性へ分解する必要がある。
- status: complete

## Q-006 First decisions

- type: `ANSWER`
- answer: 最初に曲の長さと感情的な雰囲気を決めたい。選択に応じたasset推薦と、keyに合うchordの優先表示がほしい。
- status: complete

## Q-007 Ten-minute success

- type: `ANSWER`
- answer: chord progressionとmelodyの一部ができている。
- status: complete

## Q-008 Thirty-minute quality

- type: `ANSWER`
- answer: 30分時点で必須保証したい追加品質は特にない。
- interpretation: 30分は独立したhard gateではなく、10分から60分へ育てる中間checkpointとして扱う候補。
- status: complete

## Q-009 Sixty-minute success

- type: `ANSWER`
- answer: 推薦assetで作ったchord progressionへ鼻歌melodyを載せ、melodyを加工・洗練し、適切なFXを適用できる。
- status: complete

## Q-010 Block granularity

- type: `ANSWER`
- answer: 固定粒度ではなく、10分、30分、60分と制作が進むにつれてblockを段階的に細かくしたい。
- status: complete
- unknown: 各段階の具体的なbar数・編集単位はprototypeで検証する。

## Q-011 Song structure

- type: `ANSWER`
- answer: 最初は候補から選択し、最終的には自由編集が必要。
- status: complete

## Q-012 Control depth

- type: `ANSWER`
- answer: BPM、key、chord、tone、mix等を固定して隠すのではなく、必要に応じて全項目を可変にしたい。
- interpretation: 初期画面へ全controlを同時表示する要件ではなく、progressive disclosureで全項目へ到達可能にする候補。
- status: complete

## Q-013 Voice input

- type: `ANSWER`
- answer: 作りたいものは歌・歌詞付き楽曲ではなく、instrumental / BGM。
- status: partial
- unknown: speech commandとして実際に言いたい短い言葉と、期待する編集結果。
- clarified requirement: vocal / lyrics generationは初版非対象。

## Q-014 Microphone fallback

- type: `ANSWER`
- answer: microphoneを使わない場合に、clickだけで同一結果へ到達できる必要はない。
- status: complete

## Q-015 Platform

- type: `ANSWER`
- answer: WebとPWAを採用し、配布負荷のあるWindows nativeは不要。
- status: complete

## Q-016 Smartphone scope

- type: `ANSWER`
- answer: smartphoneでも新規作成、途中編集、試聴、共有のすべてを行いたい。
- status: complete

## Q-017 Project safety

- type: `ANSWER`
- answer: autosaveとofflineは不要。undo / redoとproject fileは必要。保存は明示操作でよい。
- status: complete

## Q-018 Sound source

- type: `ANSWER`
- answer: 自作音源は前提にせず、生成音源とuser uploadを想定する。BOOTH等で入手した音源を取り込みたい。
- status: complete
- follow-up: 購入物の利用許諾、再配布、加工、生成物への混入、project共有時のasset同梱境界を確認する。

## Q-019 Output / Share

- type: `ANSWER`
- answer: 通常の保存とaudio exportが必要。XとMisskeyのshare buttonがあると嬉しい。商用利用は初版で扱わず後から検討する。
- status: partial
- unknown: audio format、project file format、share時に投稿する内容とinstance指定方法。

## Q-020 Non-goals

- type: `ANSWER`
- answer: 初版ではcommercial versionとtone/sound自作機能を作らない。
- status: complete

## Cross-cutting findings

### Confirmed direction

- personal-first product
- Web / PWA
- instrumental / BGM only for v1
- humming-derived melody as the main originality input
- chord / asset recommendations for theory assistance
- progressive refinement from large blocks to fine editing
- full smartphone workflow
- explicit save, project file, undo / redo
- generated assets and user uploads
- audio export and optional X / Misskey share entrypoints

### Main product tension

AIやtemplateによる補助の量自体は問題ではない。本人由来のhummingやイメージ指示が結果へ追従し、生成後に本人が重要箇所を深く編集できることが、自作感と最初のvertical sliceを決める。

### Open decisions

- 初版で優先する編集対象と、humming・イメージ指示への追従を判定する基準
- hummingからmelodyへ変換する技術方式とlocal実行可能性
- local music AIのmodel、license、計算資源、Web/PWAとの接続方式
- uploaded assetのlicense metadataとproject/share時の扱い
- speech commandの具体例
- audio / project export format
- mobileで全機能を成立させるinteraction density
