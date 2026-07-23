# Follow-up Answers

## Metadata

- source: ユーザー回答（2026-07-21）
- parent questionnaire: `docs/discovery/question-backlog.md`
- normalization rule: 回答、解釈、要件signal、未決を分離し、編集方法を推測で確定しない。

## F-004 AI補助と自作感の境界

### Probe 1: AIへ任せる量と本人の意図

- type: `ANSWER`
- answer: 曲作りの多くはAIへ任せてよい。ただし、本人が入力した鼻歌や「こういうイメージ」という指示は、生成結果へきちんと採用されてほしい。自由度、特に生成後の編集性能を高くしたい。
- interpretation: 自作感を決める主因は、人間が手作業した割合ではなく、本人のcreative inputが結果に反映され、AIの結果を本人が後から採用・修正できることである。
- requirement signal: AI出力は最終audioだけで閉じず、少なくとも本人が重視する音楽要素を再編集できるrepresentationまたは操作を提供する必要がある。
- status: complete

### Probe 2: 編集対象の優先順位

- type: `ANSWER`
- answer: 最優先はmelodyのpitchとrhythm。chordを細かく直す需要はなく、自動生成またはasset配置でよい。曲構成は、最初からある程度の流れを持たせ、その流れや展開をassetとして選べるとよい。instrumentは多くの音源が必要で、所有するStudio One製品版の資産流用または自動生成を候補にできる。FX / mixの専門知識は少なく、FXの雰囲気をvoice memoで伝える方法または選択式がよい。
- confirmed priority: `1. melody pitch / rhythm`
- interpretation: 深い手編集はmelodyへ集中させ、chord・arrangement・sound palette・FXは生成、推薦、asset差し替え、雰囲気指定によって複雑さを抑える。
- requirement signal: 初版のstructured music dataは、少なくともmelody noteのpitchとtimingを直接変更できる必要がある。chordは理論的な直接編集より、候補再生成とasset差し替えを優先する。
- status: partial
- unknown: 2番目に優先するのが展開asset、instrumentの豊富さ、FXの雰囲気指定のどれか。voice memoが、話し言葉による指示、口で表現する効果音、参考音源の録音・添付のどれを意味するか。
- feasibility boundary: Studio One製品の音源・loop・preset・plug-in等をWeb/PWAから流用できるとは未確認。format、license、export方法、project同梱・再配布境界を調査してから判断する。

### Probe 3: model-firstとpartial adoption

- type: `ANSWER`
- answer: 残りの要件質問より先に、music generation、generation補助、sound source生成へ使えるmodelがどれだけあるか調査する。fitするmodelだけを部分採用し、不足部分は従来のWeb実装、logic、豊富なtemplate / assetから選べる方法で補う。
- confirmed strategy: model単位ではなくcapability単位で部分採用し、AIなしのfallbackを常設する。
- research result: 一次資料で14系統を比較し、Basic Pitch TS、ACE-Step 1.5、Stable Audio 3、MusicGen Melody、CLAP、Magenta.jsをshortlistにした。詳細は`docs/research/music-ai-model-landscape-2026-07-21.md`。
- status: complete

### Current decision

要件質問は一時停止中。質問の再開点はProbe 2b。

## F-005 Home GPU serverとsmartphone fallback

- type: `ANSWER`
- answer: 自宅のRTX 5080 serverでmodelを動かし、Cloudflare等でlocal serviceを中継する前提でよい。smartphoneでheavy generationが難しい場合は必須にせず、生成済み候補の編集と非AI workflowを保証する。現在PCのCodex以外のAI modelを終了し、約10GB model取得とlocal generation検証を実行してよい。用途別modelは、容量が許せば同時常駐し、難しければ順番に起動・切替してよい。
- confirmed topology: heavy generationはuser-managed home RTX 5080 server。Web / PWAからremote jobとして利用する。
- confirmed degradation: smartphoneはserver / heavy AIが使えなくても、生成済み候補の編集とtemplate / rule / asset workflowを継続する。
- explicit approval: dependency導入、ACE-Step 1.5 core約10GB取得、GPU fixture、Codex以外の確認済みAI runtime停止。
- interpretation: home serverは同期的な必須dependencyではなくoptional capability。model residencyは希望ではなく実測VRAMで決める。
- research result: ACE-Step DiT-onlyとDiT + 1.7B LMの10秒fixtureは技術的に成功。後者はpeak reserved 14,128MiBのため、後続のユーザー判断で不採用・再実行禁止になった。詳細は`docs/research/rtx5080-local-music-generation-spike-2026-07-21.md`。
- later constraint: peak reserved 14GB級では他作業ができなくなるため使わない。約10GBまでを上限とする。
- normalized requirement: 10,240MiB / processをhard capとし、実測allowlistだけを起動する。DiT + 1.7B LMは成功済みでも不採用・再実行禁止、DiT-only 7,504MiBだけを現在のallowlistとする。
- storage permission: Gドライブ側のLLM領域へアクセスできない場合、問題解決のためCドライブ配下へ専用directoryを作成・操作してよい。必要がない時は追加directoryを作らない。
- unresolved: Cloudflareのlive resource構成、domain、identity、artifact retention、home server sleep / wake、主観的genre fit、humming追従。
- status: Product topology complete / transport and quality acceptance pending
