# Design prototype browser QA

## 判定

`PASS for Pastel project foundation, arrangement editing, humming range, and whole-song Canvas editing`

Pastel Patchboardのproject shelf、通常workbench、60分detailと、比較履歴のHallmarkをlocal loopback serverとinstalled Chrome 150.0.7871.127で確認した。production app、cross-browser、実microphone、実sample、実AI、file出力、外部shareの合格を意味しない。Web Audioのlocal oscillatorによるtimeline previewとasset別sample phraseだけはuser gesture後に実動作させた。

## 対象

| Surface | viewport |
| --- | --- |
| Hallmark comparison history | 1440x1000、768x1024、414x896、375x812、320x700 |
| Pastel project shelf | 1440x1000、768x1024、414x896、375x812、320x700 |
| Pastel phase workbench | 1440x1000、768x1024、414x896、375x812、320x700 |
| Pastel 60-minute whole-song editor | 1440x1000、768x1024、414x896、375x812、320x700 |

全20 surface / viewportで次が0件だった。

- document / body horizontal overflow
- console error、failed request、HTTP 4xx / 5xx
- duplicate ID、accessible nameなしのcontrol、heading level skip
- coarse pointerで44x44 CSS px未満のvisible control
- clickable textの複数行wrap
- header / nav / main / footer landmark不足
- viewport別の自動検査issue

## 操作journey

Pastel Patchboardで44項目を連続操作し、すべてpassした。

1. 3件のproject shelfと、新規作成時の長さ・雰囲気・key・BPM
2. 音のピース開始で先頭の「曲の設計」へ入り、persistent headerに4条件が残らないこと
3. 曲の設計から音を組むworkspaceへ進むこと
4. 鼻歌開始から30分melody workspaceへ移動し、section内の開始位置と長さを選ぶこと
5. 鼻歌の準備、録音、解析、選択範囲内6音の候補という4 state
6. 30分のpitch編集、展開asset交換、BridgeとBreakの分離、section template追加
7. pointer dragによるsection並べ替えと、neutralな`data-role`枠、`data-tone`不使用
8. 10分のasset workspace、10カテゴリ、`Round Pluck`の1 tap Web Audio試聴
9. 10分の展開固定説明が常時copyではなくdisabled selectのtooltipであること
10. 60分のwhole-song Canvas、PPQ 480、1/16T、1/32、zoom、scroll
11. Canvas noteの縦横drag、右端resize、空白double click追加、Delete、duplicate / delete
12. AI固有の生成イメージ・生成範囲と、曲の設計条件の自動参照summary
13. capability model disclosure、AI loading / success、undo / redo、manual save
14. `?`内のstate sample、timeline realtime preview、keyboard focus、作成した5件のproject shelf

interaction console errorは0件だった。

## 60分editorの軽量性

最終interaction runで次を観測した。performance budgetはまだProductとして未決のため、測定値を合否thresholdにはしていない。

| 観測 | 値 |
| --- | ---: |
| detail DOM node | 413 |
| note DOM node | 0 |
| 全曲note data | 42 |
| viewport内draw note | 6 |
| Canvas backend | Canvas 2D / main thread |
| Canvas draw | 2.4 ms |
| pointer drag計測 | 100.3 ms |
| 同期render | 3.6 ms |
| Canvas backing / CSS width | 1,344 / 1,344 px、DPR 1 |

全曲noteを保持するが、viewportと交差するnoteだけをdraw / hit-testした。1/16T・1/32のgrid cellやnote buttonをDOMへ生成していない。Canvas backing storeは`devicePixelRatio`へ合わせる。観測したpointer時間はPlaywrightが8 stepのmouse moveを送るjourney全体であり、browser INPではない。

実際の操作では、note dragで`F#4 / 15360 tick`から`G4 / 15840 tick`へ変化し、右端dragでlengthが変化した。空白double clickで全曲noteが42から43へ増え、Deleteで42へ戻った。

## Observed load evidence

Google Fonts requestをinterceptし、local fallback stackで測定した。Core Web Vitalsではなく、loopback上のnavigation timingである。

| Surface | load |
| --- | ---: |
| Hallmark history | 119–147 ms |
| Pastel project shelf | 13–53 ms |
| Pastel workbench | 13–51 ms |
| Pastel detail | 24–50 ms |

## Visual observation

- Project shelfは大きなmarketing titleを置かず、既存projectと新規作成を最初のviewportへ出した。
- workspaceは「曲の設計」「音を組む」「展開を整える」「メロディ編集」の4面で、project-wide条件をAI固有入力と分離した。
- 10分、30分、60分のphase tabに役割名を併記し、phase変更で既定workspaceがasset、arrangement、melodyへ変わる。
- 展開sectionはneutralなarrow、cut corner、chamfer、dashed、double-edge等の枠形状。pastel色はtrack rowへ残した。
- 60分はwhole-song overview、viewport range、Canvas piano roll、note property editorを持つ。desktopではCanvasを全幅にし、hummingとAIをその下へ置く。
- 常時表示していたprototype copyと一般的subtitleを除き、Home AIオフライン等の実状態labelだけを残した。

## Evidenceと再実行

- runner: `scripts/run_design_browser_qa.cjs`
- static gate: `scripts/validate_design_prototypes.py`
- machine-readable result: `.tmp/browser-qa/report.json`
- screenshots: `.tmp/browser-qa/*.png`

`.tmp`はGit対象外である。runnerを再実行すると同じevidenceを再生成する。

## 残余リスク

- Chrome 1 engineだけを確認した。Safari / iOS WebKit、Firefox、Android実機は未確認。
- Google Fonts本体をinterceptしたため、exact font glyph、CLSは未確認。
- axe-coreは依存追加を避けたため未導入。DOM / landmark / name / hit target / focus / heading / token contrastのequivalent checkであり、full WCAG auditではない。
- 鼻歌は実microphoneを使わないstate transition、asset試聴はoscillatorによる代替音である。Basic Pitch、実sample、mobile実機audio latency、WAV render、home AI transportは未確認。
- Canvas 2DをFirefox / WebKitとDPR 2以上で実測していない。OffscreenCanvas / WebGL / WebGPUへの昇格は性能budgetとbrowser matrix確定後に判断する。
