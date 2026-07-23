# Design comparison prototypes

同じ機能・fake dataで比較した後、2026-07-21にPastel Patchboardをproduction visualの正本として選択した。
Hallmark案は比較履歴として保持する。選択後のworkbench refinementはPastel側を基準にするため、DOM parityは今後の要件にしない。

| 案 | 入口 | 視覚言語 |
| --- | --- | --- |
| Hallmark | `hallmark/index.html` | Playful / Workbench / Hum / N7 / Ft5 |
| 独自 | `pastel-patchboard/index.html` | 明るい中立面、低彩度pastel、solid rule、patch port |

## 比較履歴

- 両案は`shared/prototype-data.js`と`shared/workbench.js`を共有する。選択後はPastel側だけ構造を発展させる。
- microphone、AI生成、save、WAV export、SNS shareはfake stateで、外部入力・外部送信・file出力を行わない。
- desktopと320 / 375 / 414 / 768pxを含むmobileで、新規条件設定、asset選択、展開選択、鼻歌候補、melody pitch / timing、undo / redo、試聴、出力導線を確認する。
- `操作状態の見本`でdefault、hover、focus、active、disabled、loading、error、successを確認する。

## Pastel refinement

- 最初の画面を3件のproject shelfと新規作成にした。新規作成は鼻歌開始または音のピース開始を選ぶ。
- 鼻歌開始は`準備 → 録音 → 解析 → 音符`を自動遷移し、30分のmelody editorへ入る。
- main workbenchの大きなtitle / subtitleを除き、project名をcompact表示にした。長さ・雰囲気・key・BPMはpersistent headerから外し、新規作成と先頭の「曲の設計」へ置いた。
- workspaceは曲の設計、音、展開、melodyの4面。10分 / 30分 / 60分phaseごとに既定workspaceと編集粒度を変えた。
- 4 workspaceを同時列表示せず、それぞれ全幅tabへ分けた。
- 音カテゴリをコード、ドラム、ベース、リード、シンセ、パッド、アルペジオ、パーカッション、FX、つなぎの10種へ拡張した。
- 音のピースに1 tap試聴を置き、カテゴリ別の短いWeb Audio sample phraseを鳴らす。
- 展開assetを`Twin Drop`、`Gentle Rise`、`Story Break`から選べるようにした。
- Intro / Build / Drop / Break / Outro等は色ではなくneutralな枠形状で区別し、track側の色対応と分離した。
- 10分は展開を固定、30分はBreak / Bridgeを分けたsection template追加・drag並べ替え・bars / energy / transitionと、選択範囲への鼻歌差し込みを扱う。
- 60分はPPQ 480の全曲note dataをhigh-DPI Canvas 2Dへviewport描画し、pitch / timing drag、length resize、double-click add、Delete、duplicate、quantize、velocity、zoom / scrollと1/16T・1/32 gridを扱う。
- AI panelには生成イメージ・参考音・生成範囲を置き、曲の設計条件はread-only summaryとして自動参照する。
- `操作状態の見本`は常時表示せず、headerの`?`から開く。
- capability別のmodel / non-AI routeを表示する。同目的のmodel pickerは置かない。
- 再生buttonはuser gesture後にlocal Web Audioの低音量内蔵シンセを鳴らす。外部audio、実asset、model、networkは使わない。
- `Home AI オフライン`等の実状態labelは残し、説明subtitleはtitle / screen reader textへ退避した。prototype説明copyは常時表示しない。

## Local preview

repository rootでstatic serverを起動し、次を開く。

- `/docs/design/prototypes/hallmark/`
- `/docs/design/prototypes/pastel-patchboard/`

`file://`でも構造は開けるが、browser security差分を避けるためHTTP previewを正とする。

## Hallmark build summary

**Hallmark · v1.1.0**

- **Macrostructure** · Workbench
- **Theme** · Hum（warm cream · pear / cyan / coral · rounded sans）
- **Enrichment** · none（actual workbench is the first viewport）
- **Sections** · Nav · Project conditions · Asset library · Arrangement · Melody / AI inspector · State lab · Statement footer · Transport
- **Motion** · purposeful hover response · character breathe · functional spinner
- **Slop test** · 58 / 58 ✓

## 未決定

Pastel visualは採用済みだが、このartifact自体はproduction appではない。brand name、start screen、実音源engine、
microphone、AI接続、file出力、shareは別の実装・検証を必要とする。
