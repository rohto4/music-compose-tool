# Web Compose reboot research / reuse audit

調査日: 2026-07-31

Question type: current-state comparison → product recommendation

## 問い

ブラウザでDAWを小型再現するのでも、AIへ一曲を丸投げするのでもなく、「曲を自分で前へ進められた」と感じられる最強のWeb Compose体験は何か。

## Evidence: current products and platform

| Source-backed fact | Product implication | Primary source |
| --- | --- | --- |
| BandLab Studioはbrowser / phoneでrecord、edit、mixを行うcloud DAWで、最初にAudio、Instrument、Audio / MIDI import、sound library等のtrackを選ぶ。 | Web DAWとしての総合機能だけでは差別化にならない。初手を「track追加」より作曲判断へ寄せる余地がある。 | [BandLab Studio guide](https://help.bandlab.com/hc/en-us/articles/115002945153-Getting-Started-with-the-BandLab-Studio) |
| Soundtrapは40,000超のloop / sound、Sampler、Retro Synth、one-click Chords、50超のeffectsを訴求しつつ、低latencyとload timeのためdesktop app betaも案内している。 | asset量の競争は巨大catalog保有者が強い。Webの音質・latency制約は無視せず、制作判断とportable handoffを独自価値にする。 | [Soundtrap features](https://www.soundtrap.com/content/features) |
| Ableton Learning Musicは経験や機材を要求せず、small musical ideasをclickでon / offし、組合せと時間変化から音楽を理解させる。 | 説明を読ませる前に、1 gestureで音楽的結果を返すinteractionは維持すべき強い原則。 | [Ableton Learning Music](https://learningmusic.ableton.com/) |
| AudioWorkletはcustom audio処理をmain threadと別のaudio threadで実行し、低latency処理を支える。 | transport / UIとaudio renderingを分離し、編集負荷で発音を崩さないArchitectureがbrowserでも現実的。 | [MDN AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) |
| OPFSはorigin-privateでperformance向けのin-place accessを提供し、workerから同期accessも可能。ただしsite data消去で失われ、user-visible fileではない。 | local-first working setに使えるが、明示snapshot / portable project exportを必須にし、OPFSを唯一の保存先にしない。 | [MDN OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) |
| DAWproject 1.0はopen / freeなZIP + XML exchange formatで、audio、note、automation、plugin state等を表現し、複数DAWがsupportする。native formatやperformance formatは非目標。 | Web内で完結させるより、note / track / automationをDAWprojectへ段階的に渡すことをProductの出口にできる。 | [DAWproject specification](https://github.com/bitwig/dawproject) |

## Evidence: user-provided and repository-observed

- ユーザー判断: 現行Projectは一旦失敗。
- 現行実装は33 test files / 150 tests、Chromium 15 journey、136 sound profile、46 chord、42 role pattern等の技術的proofを持つ。
- 一方、音楽的な完成感、実耳品質、操作の納得感は最後までユーザーgateに残った。
- Humming / full generationは品質の振れ幅が大きく、primary workflowからpattern-firstへpivotした。
- 入口3つ、制作段階3つ、INSERT SOURCE 5つ、音色・コード・patternの大catalogが同時に存在し、利用者が「何を選べば曲が前へ進むか」を判断する負荷が増えた。

## Inference: why Phase 1 failed

### 1. 技術的完成度をProduct truthとして扱いすぎた

test数、journey数、asset数は壊れにくさを示す。しかし、押した瞬間に「続きを作りたい」と思える音と流れは測れていない。検証の厚さが、主体験の弱さを覆った。

### 2. 機能を足すたびに入口と分類が増えた

AI、鼻歌、Pattern、Chord、Phrase Kit、Sound Chunk、DAWを別の棚として説明した結果、利用者は曲より先にProductのtaxonomyを学ぶ必要があった。

### 3. Web内でDAWを完結させようとしすぎた

Webはinstant access、共有、提案、比較に強い。一方、専用DAWが持つ音源、plugin、精密mixの全てを同じ品質で再現するには不利がある。Studio Oneへのhandoffを出口ではなく補助機能として扱ったため、役割がぼやけた。

### 4. AIを入口に分離した

AI StarterとHumming Studioを別routeにすると、AIが「制作中の選択を助ける存在」ではなく「別の作り方」になる。結果を採用／拒否／部分適用するcontrolが主役にならなかった。

### 5. 音色の幅を音色の説得力より先に増やした

Web Audio合成でcatalogを拡大しても、聴感差・genre fit・mixで使える完成度が伴わなければ、候補数が迷いを増やす。

## Reuse decision

| Asset / principle | Decision | Reason |
| --- | --- | --- |
| Project / Track / Clip / Note / Automationの編集可能data | Keep | AI、手編集、exportを同じtruthへ収束できる。 |
| Command history、scope、undo / redo | Keep | AI提案を安全な差分として扱う基盤になる。 |
| local-first working set + manual portable snapshot | Keep, redesign storage | OPFS + explicit project exportへ置き換える価値がある。 |
| MIDI / WAV / stems / DAWproject handoff | Elevate | Webが最終DAWを置換せず、最高の曲作り開始面になる。 |
| Instrumental Creative Brief / structured prompt | Keep as source, redesign contract | free-text promptでなく、意図・保護対象・変更scope・検証条件へ分解する。 |
| license / provenance / external gate | Keep | user-owned assetとAI outputを安全に扱うため不可欠。 |
| 3 start routes / 3 stages / 5 source tabs | Retire | Product taxonomyを先に学ばせる。 |
| 大量catalogを完成度の代理にする方針 | Retire | 量より、現在の曲に合う少数候補と即時A/Bを優先する。 |
| AIを独立surfaceにする方針 | Retire | すべての編集箇所でscope付きproposalとして呼び出す。 |
| browser内で精密DAWを完全再現する方針 | Retire | semantic zoomで必要な詳細だけ開き、深いmixはDAWへ渡す。 |

## Recommendation

新Productは、**一枚のLiving Scoreを聴きながら、AI／手操作／鼻歌をすべて「選択範囲への提案」に変換し、Song → Phrase → Noteをsemantic zoomするWeb composer**にする。

仮称は **KASANE**。中心loopは次の4つだけとする。

1. **PLAY** — 開いた瞬間に現在の曲を鳴らす。
2. **POINT** — 変えたいsection / role / phraseを指す。
3. **PROPOSE** — 手操作、text、鼻歌、AIの候補を音付き差分として比較する。
4. **COMMIT** — 1つを採用し、いつでも戻し、DAWへ持ち出す。

機能数ではなく、このloopから外れる操作を初版へ入れない。
