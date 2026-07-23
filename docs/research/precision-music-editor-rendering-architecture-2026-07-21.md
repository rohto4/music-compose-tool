# Browser精密音楽editor描画Architecture調査

*調査日: 2026-07-21 | 対象: Pastel Patchboard 60分仕上げ | 確度: 中〜高*

## 結論

60分仕上げの初版描画基盤は、`Canvas 2D`をmain threadで使い、曲全体のnote dataはPPQ tickで保持しつつ、viewport内だけを描画する。DOMはtoolbar、property editor、keyboard操作、screen reader用の代替UIへ限定する。noteの選択、移動、長さ変更はPointer Eventsとpointer captureで扱い、再描画はdirty flag付き`requestAnimationFrame`へまとめる。

`OffscreenCanvas` worker、WebGL 2、WebGPUは初版の必須条件にしない。Canvas draw時間、visible note数、interaction latencyを実測し、budgetを満たせない場合だけ順番に昇格する。音声render / schedulingはpaint loopから分離し、production audio engineではWeb Audio clockとAudioWorkletを使う。

## 確認できた事実

### Studio One

- PreSonus公式supportは、Studio Oneのgraphicsがhardware acceleration、GPU driver、antialiasing、display scalingの影響を受けることを案内している。
- Linux版はhardware-accelerated graphicsにVulkan 1.1またはOpenGL ES 2互換driverを要求し、Vulkan surface / swapchain extensionも明示している。
- 同じ公式資料はaudio processing threadを高いpriorityで動かすことも説明している。
- 一方、Windows / macOS版を含むpiano rollの描画engine、retained / immediate mode、note culling、hit-test index、thread構成は公開資料から確認できなかった。

したがって「Studio Oneの内部実装を再現した」とは表現しない。再現対象は、GPUを利用できるraster surface、viewport変換、表示範囲だけの描画、UI描画とaudio processingの責務分離という公開情報と整合する性質である。

### Web platform

- WHATWG HTML StandardはCanvas 2D、WebGL、WebGL 2、WebGPU contextと、DOMへ接続しないためworkerで利用できる`OffscreenCanvas`を定義している。
- W3C Pointer Eventsはmouse / pen / touchを1つのevent modelで扱い、`setPointerCapture()`後のpointer eventを同一elementへ配送できる。
- W3C Web Audioはcontrol threadとrendering threadを分離し、AudioWorklet scriptをaudio rendering threadで実行するmodelを定義している。
- WebGPUはGPU上のrender / computeを公開するAPIだが、2026-07-21時点のW3C文書はCandidate Recommendation Draftである。初版の2D note editorにはAPI複雑性とfallback負担が先に立つ。

## 採用Architecture

### Data model

- time: PPQ 480 tick / quarter note
- bar: 4/4をbaselineとし1 bar = 1,920 tick
- note: `{id, pitchMidi, tick, durationTick, velocity}`
- arrangement: sectionごとのbar数を累積し、全曲のtick範囲を決める
- viewport: `{startBar, barsVisible, topPitch, pitchRowsVisible}`

UI表示用の拍文字列を正本にせず、整数tickから導出する。1/16は120 tick、1/16 tripletは80 tick、1/32は60 tickで表す。

### Render layers

1. section / bar / beat / pitch grid
2. visible note
3. selection / resize handle / playhead

prototypeは1枚のCanvasへ順番に描くが、dataと関数はlayer単位へ分ける。高負荷になった場合にbackground bitmap cacheまたは複数Canvasへ分離しやすくする。

### Viewport cullingと解像度

- Canvas backing storeはCSS sizeに`devicePixelRatio`を掛ける。
- `startTick`から`endTick`までに交差するnoteだけをdraw / hit-test対象にする。
- 曲全体を横長DOMへ展開しない。overview railとscroll rangeでviewportを移動する。
- zoomは`barsVisible`を変え、全曲dataは変更しない。

### Interaction

- Pointer downでnote bodyまたは右端resize handleをhit-testする。
- `setPointerCapture()`でpointerがCanvas外へ出てもdragを継続する。
- drag中はsnap幅でtick / pitch / durationをpreview更新し、pointer upで1回だけhistoryへcommitする。
- keyboardとproperty buttonsで同じpitch / timing / length操作へ到達できるようにする。

### Audio boundary

Canvasの`requestAnimationFrame`をaudio schedulerにしない。prototypeの内蔵oscillator previewはuser gesture後だけ動かす。productionではWeb Audio clockで先読みし、custom DSPが必要な場合にAudioWorkletへ置く。

## 昇格条件

| 段階 | 採用条件 |
| --- | --- |
| Canvas 2D main thread | 初版。visible noteだけを描画し、draw時間とinteraction latencyを計測する |
| OffscreenCanvas worker | grid / note drawがmain-thread interactionを継続的に阻害し、対象browserでworker転送を検証できた場合 |
| WebGL 2 | 数千〜数万visible primitiveでCanvas 2Dがbudgetを満たさず、texture / buffer lifecycleを正当化できる場合 |
| WebGPU | WebGL 2でも不足し、browser / device matrix、fallback、accessibility代替UIを含む導入価値が実測で上回る場合 |

昇格は実測に基づく。APIが新しいことだけを理由にWebGPUへ移行しない。

## Prototype検証項目

- whole-song bar数とviewport bar数が別値である
- horizontal scrollとzoomで描画範囲が変わる
- 1/16、1/16T、1/32へsnapできる
- note body dragでpitch / tick、右端dragでdurationが変わる
- visible note数だけをdrawする
- DOM node数、Canvas draw時間、pointer interaction時間、DPR backing sizeを記録する
- 320 / 375 / 414 / 768 / 1440pxでtoolbarとCanvasがviewport外へ漏れない
- keyboard / DOM property controlsから同じ編集ができる

## 未解決

- productionのbrowser support matrixとmobile実機のpointer / audio latency
- 数千note時の具体的performance budget
- polyrhythm、拍子変更、tempo automation、MPE、automation laneの正本schema
- screen reader向け全note一覧をvirtual listにする境界
- productionでのworker / WebGL / WebGPU昇格要否

## 一次資料

- PreSonus, [Studio One Pro 7: Graphics Problems](https://support.presonus.com/hc/en-us/articles/29252523154317-Studio-One-Pro-7-Graphics-Problems)
- PreSonus, [Linux - Getting Started](https://support.presonus.com/hc/en-us/articles/19214558269581-Linux-Getting-Started)
- WHATWG, [HTML Standard: Canvas](https://html.spec.whatwg.org/multipage/canvas.html)
- W3C, [Pointer Events](https://www.w3.org/TR/pointerevents/)
- W3C, [Web Audio API 1.1](https://www.w3.org/TR/webaudio-1.1/)
- Khronos Group, [WebGL API Registry](https://registry.khronos.org/webgl/)
- W3C, [WebGPU](https://www.w3.org/TR/webgpu/all/)

## 調査方法

Studio OneはPreSonus公式supportだけを採用し、内部rendererを説明する非公式推測は根拠にしなかった。Web APIはWHATWG、W3C、Khronosの仕様を用いた。公開事実から直接確認できないStudio One固有のnote editor実装はevidence gapとして残した。
