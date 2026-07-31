# KASANE Product Design

Status: V2 direction adopted / local Proof A in progress

Codename: `KASANE`

Tagline: **曲の流れを触って、音にする。**

## 2026-08-01 V2 decision

鼻歌と生成AIはprimary workflow、main navigation、Product promise、最初のproofから外す。KASANEの最初の製品仮説は、少数精鋭のHero Kitを選び、scene / roleを見ながら決定論的なScene Moveをsame-point A/Bし、commit / undoする`Composition Desk`である。本書の後段に残るAI / humming記述はV1検討履歴であり、V2実装要件ではない。現在の受入正本は[`kasane-composition-desk-capability.md`](../spec/kasane-composition-desk-capability.md)。

## 1. Product statement

KASANEは、音楽理論やDAWの操作体系を先に学ばなくても、現在の曲を聴きながら「ここをもう少し高揚させたい」「この鼻歌を主線にしたい」と場所を指し、複数の音付き差分から自分の曲を育てるWeb composerである。

Web内で最終mixの全てを置換しない。**作曲判断を最速・最深にし、編集可能なままStudio One等へ渡す**ことを役割とする。

## 2. Who it is for

Primary user:

- 頭の中に雰囲気や断片はあるが、白紙のDAWと音色browserの前で止まる人。
- loopを並べるだけでは自作感が足りず、melody、展開、タイミングには自分の判断を残したい人。
- PCで曲を組み、phoneでは試聴、選択、鼻歌capture、reviewをしたい人。
- 最後はStudio One等で音源、plugin、mixを仕上げたい人。

Not primary:

- browserだけでcommercial masterまで完結したい専門mix engineer。
- 毎回1 promptで完成audioだけを受け取りたい利用者。
- vocal / lyrics productionを中心にする利用者。

## 3. Product promise

### 3.1 Always musical

画面を開いた時点でLiving Scoreがあり、playすると現在の全体像が鳴る。空のtrackを追加してから考え始めない。

### 3.2 One place, three depths

画面遷移や制作modeではなく、同じ音楽objectをsemantic zoomする。

- **SONG** — sectionの流れ、energy、役割の出入り。
- **PHRASE** — 4〜8小節のharmony、rhythm、motif、variation。
- **NOTE** — pitch、timing、length、velocity、automation。

どのdepthでも同じProject、selection、playhead、undo historyを使う。

### 3.3 AI proposes; the user authors

AIはProjectを直接書き換えない。選択範囲に対する`Change Proposal`を作り、before / A / B / Cを同じplayheadから試聴させる。採用した差分だけがProject commandになる。

### 3.4 The way out is first-class

Project snapshot、Standard MIDI、WAV / stemsに加え、共通dataから段階的にDAWprojectを生成する。Webで始めた曲がWebに閉じ込められない。

## 4. The only core loop

1. **PLAY** — 現在の曲を同じ位置から鳴らす。
2. **POINT** — 変えたいsection、role、phrase、noteを直接選ぶ。
3. **PROPOSE** — gesture、text、鼻歌、AIから音付き差分を得る。
4. **COMMIT** — 採用、部分採用、棄却、比較へ戻る。

初版機能はこのloopを短くするものだけに限定する。

## 5. Living Score

### 5.1 Scene Spine

画面上部に曲の時間とsectionを1本のspineとして置く。Intro / Build / Drop等は固定template名ではなく、長さ、energy、密度、transitionを持つsceneである。sceneを動かすと全roleの関連clipも同じ時間構造へ追従する。

### 5.2 Role Weave

中央はtrack数ではなく作曲上の役割で読む。

- Lead
- Harmony
- Bass
- Rhythm
- Texture

各roleは1本の巨大trackではなく、sceneごとのclipとvariationを重ねる。必要になった時だけinstrument laneやsub layerを開く。

### 5.3 Change Deck

右側またはselection直下に、現在の選択だけへ作用する候補を出す。

- `もっと跳ねる`
- `余白を作る`
- `鼻歌を主線にする`
- `Dropだけ厚くする`
- `コードは残してBassを作り直す`

候補はbuttonのcatalogではなく、現在の曲から生成される少数の音付きvariationである。

### 5.4 Deep Lane

double click、Enter、pinch / zoomで選択clipの内部をLiving Scoreの下へ展開する。別pageへ移動せず、上の曲構造とplayheadを見失わない。NOTE depthは必要な時だけ現れる。

## 6. Starting a song

開始時に3 routeを選ばせない。1つのstart surfaceで、利用者は次のどれを置いてもよい。

- mood / scene words
- 1つのsound
- 1つのchord
- tap rhythm
- humming
- blank-but-playable seed

入力はすべて同じ`Intent Seed`になり、最初のLiving Scoreへ変換される。足りない値はlater-editableな仮値で始め、modal validationで入口を塞がない。

## 7. Sound strategy

大量presetを最初から見せない。

- Product内には、役割が明確でmixに使える少数の`Core Rack`を置く。
- 現在のselectionと前後関係から、適合する3候補だけを提示する。
- 候補は同じMIDIを同じloudness条件でA/Bできる。
- user-owned sample / instrument exportはlicense metadataとともに扱う。
- sample packやmodelを追加する前に、redistribution、commercial、AI processingを個別に判定する。

音の幅はcatalog数でなく、**曲の中で役割が違って聞こえること**で証明する。

## 8. AI and humming

- Text、humming、reference audioは独立appではなくChange Deckへのinput。
- Hummingはまずeditable melody proposalへ変換し、pitch / rhythm lockを別々に選べる。
- 生成audioは補助previewまたはlayerであり、symbolic Projectを置換しない。
- modelがなくてもrule / template proposalでcore loopを完了する。
- 利用model、入力、seed、変更scope、preserve条件、出力licenseをproposalへ記録する。

## 9. Web / mobile roles

Desktop browser:

- Living Score全体
- semantic zoom
- note / automation
- A/B compare
- export

Phone:

- playback
- scene / variation selection
- humming / tap capture
- comments / intent
- commit / undo
- portable export

phoneにdesktop piano rollを縮小コピーしない。

## 10. Visual direction

Direction: **tactile editorial instrument**

- 背景はnear-black navy。音楽objectはpaper stripとsignal inkで表現する。
- accentはwarm amberを操作、electric cyanをplayhead / focus、coralをrecord / destructiveに限定する。
- 角丸cardの棚を作らず、時間方向のspine、譜面のrule、selectionの切り欠きで構造を示す。
- Product titleを制作面へ常時大きく出さない。
- motionはplayhead、proposal audition、commitの3箇所だけへ集中する。
- reduced motionでは位置変化をoutline / state textへ縮退する。

## 11. Non-goals for the first build

- social feed、公開marketplace、課金。
- live multi-user co-edit。
- vocal tuning / lyric generation。
- VST host、MPE、full mastering suite。
- 数百presetの内蔵catalog。
- browserだけで全DAWを置換すること。
- AIが自動でProjectを確定変更すること。

## 12. Acceptance demonstrations

数値scoreではなく、次の実演が成立した時だけ次へ進む。

1. 何も説明せず、Living Scoreを再生し、1 sceneを選び、variationを比較して採用できる。
2. textとhummingが同じChange Proposalとして現れ、対象外sceneを変えない。
3. SONGからNOTEへ深く入り、戻った時にplayheadと選択を失わない。
4. proposal採用後もbeforeへ戻り、別案をbranchとして残せる。
5. project snapshot、MIDI、WAV / stems、DAWproject candidateを同じtruthから生成できる。
6. phoneで曲全体を壊さず、試聴、selection、humming、commit / undoを完了できる。
