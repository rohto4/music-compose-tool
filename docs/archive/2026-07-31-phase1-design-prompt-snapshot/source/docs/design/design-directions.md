# Design Directions

## Selection

`Pastel Patchboard adopted / 2026-07-21`

- ユーザー理由: Hallmark案より余計な丸・角丸が少なく、かなり好みに合う。
- production visualの基準はPastel Patchboard。Hallmark案は比較履歴・反例参照として残す。
- 改修指示: main workbenchから大きなtitle / subtitleを外す。制作フェーズは作業部品へ移し、状態見本は`?`内へ退避する。
- 音カテゴリを10種類へ拡張し、展開assetを選択可能にする。
- modelはcapability別の担当を表示するが、同目的の複数model pickerは置かない。
- realtime previewは必要。prototypeはlocal Web Audio内蔵シンセ、production audio engineは別検証とする。
- 最初の画面は複数projectの棚と新規作成。鼻歌開始では準備、録音、解析、音符候補を連続して試せる。
- main workbenchは曲の設計、音、展開、melodyの全画面workspace tab。10分、30分、60分で既定面と編集parameterを変える。
- 長さ・雰囲気・key・BPMは新規作成と先頭の曲の設計へ置き、persistent headerとAI固有promptから分離する。
- 展開sectionはneutralな枠形状、trackと音のピースは色で対応付ける。
- 展開はBridgeをBreakと分離し、template追加とpointer drag並べ替えを行う。鼻歌はsection内の選択範囲へ差し込む。
- 音のピースはカード内の1 tap sample phraseで試聴する。

## 比較契約

選択前の2案は同じworkbench構造、copy、仮データ、操作stateで比較した。選択後のPastel refinementは
正本側だけで行い、Hallmarkとのparityを今後の要件にしない。

- Audience: requesting owner。回答済み。
- Use case: 音楽理論を前提にせず、本人のhummingをpitch / rhythm編集できるmelodyへつなぎ、短時間でかわいいinstrumental / BGMを自作する。回答済み。
- Tone: かわいいが幼くなく、密度は高いが迷わず、作曲面を主役にする。回答からのprovisional解釈で、brand採用済みではない。

両案のfirst viewportには、曲の長さ・雰囲気・key、推薦chord / asset、section timeline、humming input入口を含める。10分から60分へ進むにつれて編集blockが細かくなる状態を同じ仮データで表す。smartphone版も閲覧専用にせず、作成・編集・試聴・共有まで比較する。

## A: Hallmark案

- source: `docs/candi-ref/hallmark-adoption.md`
- prototype: `prototypes/hallmark/index.html`
- 現在状態: comparison prototypeとして保持。Production非採用。
- purpose: 実際の作曲workbenchをfirst viewportに置き、AI生成物に見える定型的なhero/card構造を避ける。
- selected design recipe: Playful / Workbench / Hum / N7 / Ft5。Hallmark v1.1.0の手順で比較用に選定した。
- signature: 再生位置に合わせ、選択済みcharacterと機能spinnerだけを目的付きで動かす。
- constraints: token固定、8 interaction states、320/375/414/768px、reduced motion、fabricated metric禁止。

## B: 独自案「Pastel Patchboard」

- source: ユーザーの既知の傾向と今回のproduct workflowから独自に設計する。Hallmarkのtheme/macrostructureは使わない。
- prototype: `prototypes/pastel-patchboard/index.html`
- 現在状態: production visual正本。Workbench refinement反映済み。
- tone candidate: かわいいが幼くなく、密度は高いが迷わない、触ると音が返る。
- hierarchy: project shelfから曲を開き、上部に保存と制作phase、中央は曲の設計・音・展開・melodyのいずれか1つを大きく表示、下部に常時試聴transport。
- spatial model: desktopはtimeline + pack drawer、mobileは現在sectionを中心にし、drawerをbottom sheetへ変える。
- visual system candidate: 明るいneutral canvas、役割別の低彩度pastel、太さの異なるsolid border、過度なshadowなし。
- signature candidate: 音blockを「角丸card」ではなく、接続口と役割stripeを持つ小さなpatch tileとして表現する。

## 2026-07-22 Night Grid refinement

- ユーザー要望により、Pastelの構造と信号色は維持しつつ、白ベースを廃止して濃紺〜黒の`Patchtone Night Grid`へ更新する。
- Project Homeと通常workspaceも暗色面で統一し、60分のpiano-roll / Canvas編集面は専用のほぼ黒い背景・低彩度グリッドにする。
- 角丸card、pill、影によるまとまりは採用せず、0pxの矩形境界、罫線、余白、選択時の信号色で情報のまとまりを表現する。helpと録音操作の円形は操作意味を持つため例外として残す。
- pastel pink / cyan / mint / lavenderは背景面ではなく、note source、track role、selected state、status signalへ限定する。
- phase model: 10分はasset auditionと外枠、30分はarrangementと範囲humming、60分は全曲DAW-like piano roll。60分はPPQ 480 note dataをCanvas 2Dへviewport cullingし、DOM note / grid cellを置かない。
- motion: 配置、交換、再生位置、失敗理由の説明に限定する。

## 2026-07-22 Interaction color grammar

- ユーザー実機確認で、music role色、selected色、action色が同時に競合し、押せる場所と結果が直感的に判別できないと判定された。
- 黒〜濃紺は作業surface、warm yellowはclick / tap / keyboard操作できるcontrolの専用色とする。通常controlはyellow outline、section内のprimary actionはsolid yellow、hover / pressed / focusは明度と線幅でも変化させる。
- pastel pink / cyan / mint / lavenderはnote source、track role、asset stripe等の音楽データだけに使う。panel全体や一般buttonの背景には使わない。
- greenは成功・接続、redは失敗・録音・削除、grayは非操作label・disabledへ限定する。選択中のtab / phase / assetにはyellow markerと`aria-current` / `aria-pressed`を併用する。
- 色だけを操作手掛かりにせず、矩形の枠、動詞label、同一section右端のaction配置、focus ring、disabled表現を併用する。DAWのtrack role色は上辺／左辺の細いsignalに留める。

## 2026-07-22 Harmonic Atlas refinement

- Chord Padは同じ大きさの矩形cardを並べる画面から、和声関係を読む`Harmonic Atlas`へ再設計する。基本7 degreeを横の主軸、彩りを上、意外を下へ置き、候補をtabで隠さない。
- 視覚方向は`dense instrument panel / harmonic map`。作曲面の密度を上げる一方、選択中音色、次に入力するstep、step拍数の3点を強いhierarchyで固定する。
- 48 tonal音色は`Voice Deck`としてfamily tabとcompact voice selectorへ分離する。tabは矩形のまま、voice selectorは片側を丸めたradio-key形、chord nodeは角を落としたkeycap形にして、一般card gridと識別する。
- Workspace最上部のPatchboard / Humming Studio切替は全幅帯をやめ、左上の丸い`P` / `H` controlへ縮小する。active ring、中央文字、accessible nameを併用し、丸buttonをこのsurface切替の意味ある例外とする。
- animationはChord nodeのpress、Voice Deckの選択移動、surface active ringに限定し、`prefers-reduced-motion`では位置移動を停止する。

### 全画面へ適用する設計思想

1. `Overview without hiding`: 主要な選択肢をtabの裏へ隠さず、画面内の位置関係で全体像を理解できるようにする。tabは音色family等の補助分類に限定する。
2. `State in the frame`: 現在音色、現在step、拍数、active surfaceを常時見えるreadoutへ置き、スクリーンショット一枚でも状態が説明できるようにする。
3. `Shape carries meaning`: workspace tab、surface switch、voice key、chord node、timeline stepを同じ矩形buttonにせず、役割ごとの輪郭と押下feedbackを持たせる。
4. `Compact, not tiny`: 全幅controlと重複説明を減らして制作面へspaceを返す。touch targetと文字可読性を削って密度を作らない。
5. `One tap to sound`: auditionと配置を分断せず、押した操作が即座に音とprogressionへ反映される。
6. `Progressive precision`: 一画面で全体を把握し、必要な箇所だけ拍数、pattern、MIDI noteへ順に深掘りする。

### Dark Pastel surface

- near-black一色をやめ、baseを低彩度blue-violet、panelを少し明るいslate-lavender、selected / music surfaceをblue / plum / sageの薄いcastへ分ける。
- editorは最も暗い面のままでも純黒にはせず、blue-violetを残す。gridとnoteのcontrastは既存以上を維持する。
- 背景のpastel castは低彩度・低面積にし、yellow action、pink / cyan / mint / lavender music dataの意味を奪わない。

## Prototype / QA status

- 比較入口: `prototypes/README.md`
- browser QA: `prototypes/browser-qa-report.md`
- shared implementation: `prototypes/shared/prototype-data.js`、`prototypes/shared/workbench.js`。選択後はdesign variantによる構造差を許可する。
- Chrome 150.0.7871.127でHallmark履歴、Pastel project shelf、workbench、60分detailの4 surface x 5 viewportを確認し、overflow、console error、failed request、44px未満touch controlは0件。
- Pastelのproject設計、範囲humming 4 state、Bridge追加・drag、phase別workspace、1 tap音色試聴、Canvas drag / resize / double-click追加、1/16T・1/32等44操作journeyはpass。Google Fontsはinterceptし、fallback fontで測定した。
- これはcomparison useの合格であり、cross-browser、実audio、実microphone、実AI、file出力、external shareの合格ではない。
- Pastel Patchboardだけをproduction visualへ進める。Hallmark tokenはappへ固定しない。

## 比較観点

- 最初の5秒で次の操作が分かるか。
- 10分workflowで迷う分岐が少ないか。
- desktop click、mobile touch、keyboardで同じ概念が保たれるか。
- cuteさが情報判別やfocus contrastを損なわないか。
- play、loading、selected、disabled、error、successが色だけに依存しないか。
- 長時間見ても視覚noiseが強すぎないか。
