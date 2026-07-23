# Kawaii Future Bass伴奏フレーズのロジック整理

## 目的

新規曲のラフ制作で、メロディを自動生成せず、コード・Bass・Arp・Drum・Pad・Synthを4小節単位で素早く組めるようにする。特定曲のMIDIや録音を複製せず、一般的な制作原則を独自の決定論的recipeへ落とす。

## 一次・教育資料から採用した一般則

- Native InstrumentsのFuture Bass guideは、拡張和音（7th / 9th等）、half-time系drum、rootを支えるbass、1/16 pulse、複数layerのchordを主要要素として説明する。これをDrop / Final Dropの高密度recipeへ反映した。
- Soundationのguideは、lush chord、root bass、速いsquare arp、drumを別々のlayerとして組む流れを示す。これを一括生成しても通常のTrack / Lane / NoteEventへ分離したままにする根拠とした。
- Point Blankのtutorialは、和音の構成音からarpを作り、速度・音域・順序で動きを変える手法を示す。固定melodyを生成せず、chord tone追従のArp generatorだけを使う。
- Open Music Theoryの4-chord schemasとBerkleeのprogression解説は、循環進行を機能と雰囲気の両方で扱う。UIではdegreeの事実だけでなく、Intro / Build / Drop / Break、energy、emotion tagを併記する。

## 実装へ落とした独自recipe

| Kit | 用途 | 和声と演奏形 | 主要layer |
| --- | --- | --- | --- |
| Cloud Intro | 浮遊Intro | Pop Axis + HOLD | Sub Glue / Quarter Chime / Kick & Rest / Air Pad |
| Candy Verse | 軽いVerse | Singer-Songwriter + PULSE | Fifth Answer / Offbeat Sparkle / Two-step / Pizzicato |
| Soda Build | 上昇Build | Hopscotch + PULSE | Climb & Turn / 16th Arp / Build Hats / Chorus Pad |
| Prism Drop | 明るいDrop | Royal Road + SYNC | Octave Drop / Wide Arp / Half-time / Supersaw |
| Bubble Break | 静かなBreak | Circle Turnaround + HOLD | Anchor / High Answer / Minimal Drum / Harp |
| Hyper Finale | 最大Drop | Pop Axis + SYNC | Gate Bass / Cascade Arp / Open Hat / Hyper Saw |

全kitは対象4小節だけを書き換え、Melody / Humming、手編集音、他phraseを保護する。適用はProject command 1件とし、Undo / Redo、manual save、MIDI、WAV、DAWへ同じsymbolic dataで合流する。

## 参照

- Native Instruments, “How to make future bass”: https://blog.native-instruments.com/how-to-make-future-bass/
- Soundation, “How to make future bass”: https://soundation.com/make-music/music-genres/how-to-make-future-bass
- Point Blank Music School, “Make Future Bass Chord Arps”: https://www.pointblankmusicschool.com/blog/tutorial-make-future-bass-chord-arps-like-odesza-flume/
- Open Music Theory, “Four-chord schemas”: https://viva.pressbooks.pub/openmusictheory/chapter/4-chord-schemas/
- Berklee Online, “Simple Tips for Better Chord Progressions”: https://online.berklee.edu/takenote/simple-tips-for-better-chord-progressions/
