# Discovery Question Backlog

## 運用

- コアは20問、回答によって追加する深掘りは最大10問とする。
- 20問を一括提示せず、原則1回に1問だけ聞く。
- 回答後は短く言い換え、必要なら同じ論点を1回深掘りしてから次へ進む。
- 既存回答で十分な質問は再質問せず、`answered-from-brief`として閉じる。
- 実装やデザイン判断を変えない質問は省略する。

## コア20問

| ID | Module | 質問 | この回答で決めること | 状態 |
| --- | --- | --- | --- | --- |
| Q-001 | Purpose / Why | 完成時に最も「作れるようになってうれしい」と感じる具体的な1曲・1場面は何か | 最初の成功結果 | answered |
| Q-002 | Audience | 最初に最も満足させたい利用者は誰か | primary actor | answered |
| Q-003 | Audience | その利用者は音楽制作、楽器、DAW、音楽理論をどこまで知っているか | 初期説明と専門操作の深さ | answered |
| Q-004 | Problem | 現在はどう作ろうとして、どの瞬間に最も時間を失うか・諦めるか | current workaroundと主要problem | partial |
| Q-005 | Outcome | 目標に近い参考曲と、その曲の何を再現したいか | 音楽的quality barとpack設計 | answered |
| Q-006 | First use | 最初の音が鳴る前に、利用者が自分で決めるべきことは何か | onboardingと初期入力 | answered |
| Q-007 | Time bar | 10分版を「ラフとして成功」と判断する条件は何か | 10分acceptance | answered |
| Q-008 | Time bar | 30分版で追加されていなければならない品質は何か | 30分acceptance | answered |
| Q-009 | Time bar | 60分版でどこまで自分の意図や個性を反映できればよいか | 60分acceptance | answered |
| Q-010 | Block model | 1つの音楽blockは何小節・どの役割・どの粒度が自然か | domain unit | answered |
| Q-011 | Structure | Intro、Build、Drop等の曲構成はtemplate固定、候補選択、自由編集のどこまで必要か | arrangement control | answered |
| Q-012 | Control depth | BPM、key、chord、音色、mix等で、初心者向けでも隠してはいけない調整は何か | advanced control ceiling | answered |
| Q-013 | Voice | 実際に言いたい短い言葉と、その直後に期待する変更は何か | voice command set | partial |
| Q-014 | Voice | microphoneを使えない・使いたくない場合、clickだけで同じ結果へ到達できる必要があるか | privacyとfallback | answered |
| Q-015 | Platform | 最初の完成版をWeb/PWA、Windows native、hybridのどれで使いたいか、その理由は何か | first distribution surface | answered |
| Q-016 | Mobile | smartphoneでは曲を最初から作る、途中編集する、試聴・共有する、のどれを主目的にするか | mobile scope | answered |
| Q-017 | Project safety | autosave、undo/redo、offline、project fileのうち最初から欠かせないものは何か | local data requirements | answered |
| Q-018 | Sound source | 音源・loopは自作、購入、同梱、生成、user uploadのどれを想定するか | pack supplyとlicense boundary | answered |
| Q-019 | Output | 最初に必要な保存・export・share形式と、商用利用の要否は何か | outputと利用許諾 | partial |
| Q-020 | Non-goals | 初版では明確に作らない機能は何か | v1 scope stop | answered |

## 条件付き深掘り 最大10問

| ID | Trigger | 深掘りする判断 |
| --- | --- | --- |
| F-001 | prototype作成前 | Audience、主操作、toneのHallmark design-context gateを統合確認する |
| F-002 | account、複数device、共同作業が必要 | login、cloud sync、collaboration、ownership |
| F-003 | user uploadまたはcustom packが必要 | file validation、license declaration、storage、malformed data |
| F-004 | AI生成を使いたい | 生成対象、preview/approve、cost、provider failure、権利 |
| F-005 | vocal、lyrics、歌声を含めたい | voice data、権利、言語、instrumental fallback |
| F-006 | real-time操作や厳密な再生が重要 | latency、sample rate、browser/device matrix、測定条件 |
| F-007 | keyboard、screen reader、色覚、片手操作等が重要 | accessibility acceptanceと代替操作 |
| F-008 | 一般公開・有料化を考える | pricing、quota、abuse、support、運用owner |
| F-009 | 日本語以外も対象 | localization、voice language、文字幅、content pack |
| F-010 | analyticsや改善計測を行う | telemetry、consent、retention、opt-out |

## 進行状態

- current: `JUDGE-004 model spike approval`。要件質問の再開点は`F-004 Probe 2b`（melodyに続く2番目の優先対象）。
- F-004 recorded: AIへの広い委任は許容するが、humming・イメージ指示への追従と高い編集可能性を重視する。最優先の手編集対象はmelody pitch / rhythm。chordは自動生成・asset差し替えでよい。
- core completed: `17 / 20`
- core partial: `Q-004`, `Q-013`, `Q-019`
- conditional completed: `0 / up to 10`
- current brand module: `Purpose / Why`
