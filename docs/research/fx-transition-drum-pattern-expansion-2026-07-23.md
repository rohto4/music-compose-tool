# FX / Transition / Drum pattern 拡張調査（2026-07-23）

## 調査目的

`音のピース`を名前違いのpresetで水増しせず、曲中の役割、時間方向、密度、終端処理、kitの音響profileが異なる候補へ広げる。第三者のWAV / loopは同梱せず、調査結果を内蔵Web Audio合成eventと編集可能なNoteEvent recipeへ変換する。

## 一次資料から採用した分類

- [Ableton Learning Music: Backbeats](https://learningmusic.ableton.com/make-beats/backbeats.html): 4つ打ちkickと2・4拍のclap / snareというbackbeatを、House系の基準patternとして採用した。
- [Native Instruments: How to make future bass](https://blog.native-instruments.com/how-to-make-future-bass/): 130–160 BPM、trap由来のhalf-time、8分hat、終端32分hat roll、4小節目のopen hat variationをFuture Bass patternへ反映した。
- [Native Instruments: Must-know drum fills](https://blog.native-instruments.com/drum-fills/): fillはsection終端を示し次sectionへ導く短いvariationであるため、snare roll、trap roll、tom fill、clap stutterを通常grooveと別recipeにした。
- [Native Instruments: Drum programming 101](https://blog.native-instruments.com/drum-programming-101/): 4小節周期の最終barへvariationを置く設計を採用し、常時fillにならないpatternを追加した。
- [Ableton Classroom: White Noise Riser](https://www.ableton.com/en/classroom/support/classroom-activities-main/): white noiseのfilter / volume automationで緊張と解放を作る考えを、oscillator whistleではなくfiltered deterministic noise sweepへ反映した。
- [iZotope: How to Create Better Transitions in Your Mix](https://www.izotope.com/community/blog/how-to-create-better-transitions-in-your-mix): riser / sweep、fall、snare密度を4分→8分→16分へ上げるbuildを別系統として採用した。
- [Native Instruments: Sound in film](https://blog.native-instruments.com/sound-in-film/): riser終端のreverse cymbal、filter cutoff上昇、加速するmodulation、octave layerを、reverse / impact / filter climb / digital stutterの複合recipeへ変換した。
- [Ableton Core Library changes](https://help.ableton.com/hc/en-us/articles/360020126339-Sample-changes-to-the-Core-Library-in-Live-11): official libraryの分類にWhite Noise Riser、White Noise Fall、Reverse Kick and Crash、Impact、Stutter、Shatter等があることをtaxonomy確認にだけ使った。該当sample file自体は取得・同梱していない。
- [Ableton Live Manual: Drum Racks](https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/): drum padはnoteごとの独立chainを持ち、音色差とpattern差を分離できる。アプリでもrole patternとkit assetを別dataとして保持する。

## 実装へ変換する軸

| family | 変えるもの | 追加例 |
| --- | --- | --- |
| Drum groove | kick / snare位置、hat subdivision、ghost note、4小節目variation | half-time、house backbeat、garage、break chop、drop pause |
| Drum fill | section終端の密度、音高順、velocity curve | snare accelerator、32nd hat roll、tom cascade、clap stutter |
| Drum kit | waveform、brightness、character、decay、開始／終端pitch、pan / gain | Trap Glass、Sub Club、Metallic Core、Lo-fi Paper |
| Riser / sweep | up / down、長さ、noise帯域、pan、layer数 | White Noise Rise、Filter Climb、Prism Downsweep |
| Boundary impact | kick / clap / sparkle layer、tail、sub量 | Crash Kick Impact、Low-end Slam、Candy Impact |
| Reverse / release | 吸込み方向、crash接続、下降tail | Reverse Cymbal、Reverb Suction、Sub Fall |
| Digital motion | burst間隔、stutter密度、左右移動 | Glitch Stutter、Bitcrush Spray、Pitch Spiral |

## 権利・品質境界

- 調査ページの音源、画像、MIDI、sample packはコピーしない。
- 一般的な制作技法と分類だけを参照し、NoteEvent列と合成parameterは本PJで新規に定義する。
- 追加候補はIDだけでなく、audition event fingerprintまたはNoteEvent列が異なることをtestで確認する。
- Web Audioの聴感品質は自動testだけで完成扱いにせず、ユーザー実耳レビューまで★3とする。
