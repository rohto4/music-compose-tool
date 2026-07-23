# Chord pad / pattern workflow比較（2026-07-22）

## 発火境界

物理鍵盤や音楽理論を前提にせず、padを押して和音を聴き、1小節ずつ進行と伴奏patternを組み、standard MIDI / WAVでStudio Oneへ渡す新しいprimary workflowを決めるために調査した。価格比較や製品購入判断、UIの複製、外部plugin導入は対象外とする。

## Positioning brief

- 利用者: 鍵盤で未知の和音を探すのが難しく、まず耳で選んで曲の基盤を作りたい個人利用者。
- Offer: browser内の大きなchord pad、1小節slot、role別pattern、即時試聴、instrument差替え、MIDI / WAV handoff。
- Differentiator: 生成AIの品質へ依存せず、押した結果と書き出されるnoteが決定論的で、後からDAWで編集できる。
- Strategic tension: `意外な和音の発見` × `迷わず確定・持ち出せること`。

## 比較対象

| Tier | Reference | 強い点 | 今回借りる原則 |
| --- | --- | --- | --- |
| Direct | Cubase 15 Chord Pads | chord symbol、voicing、trigger状態をpad内に表示。List / Circle of Fifths / Proximity Assistant、adaptive voicing、MIDI pattern playerを持つ | padへ「和音名・度数・voicing・発見band」を表示し、前後の声部移動が小さいvoicingを自動選択する |
| Direct | Scaler 3 | chord trackにbass / melody / phrase laneを同期し、automatic voice leading、mood tag、Scenes、Motionsで進行と演奏patternを分離する | harmonyを正本とし、chord / bass / arp等のpatternを追従させる。patternはrole / mood / densityで絞る |
| Direct | Hookpad | scale degree 1–7、Popular / Magic Chord、borrowed / secondary chord、instrument別voicing、Format 1 MIDI export | `基本`、`彩り`、`意外`の3bandで難しい理論語を隠しつつ、degreeと和音名は確認可能にする |
| Direct | Chordjam | user-guided randomization、16 chord / arp pads、quantized latch、chordとpatternを一緒にpreset化 | 無制約randomではなく、選択key・前後chord・role tag内でvariationを出す。結果は必ず再現可能なseed / IDを持つ |
| Adjacent | Captain Chords | chord、rhythm、velocityを別レイヤーで編集し、one-key play、bass / melody / beat追従、MIDI / audio drag-outを備える | chord identityと演奏rhythmを分離し、後続roleがharmonyを参照する。持ち出しを最後ではなく常設actionにする |
| Adjacent | Ableton Live 12 Stacks / Expressive Chords | scale内chord生成、root / inversion / duration、custom chord bank、Auto Apply、feel別chord setとsingle-note trigger | pad操作は即時反映し、undoで戻せるようにする。将来はuser chord bankをdata fileとして追加可能にする |
| Adjacent | Ripchord | single-noteでfull chordをtriggerし、custom preset、MIDI chord file import、recorded MIDIのDAW drag-outを行う | 1 pad = 1 chordの単純さと、pad bankを再利用可能なdataとして扱う考え方を採る |
| Adjacent | ChordPolyPad | 16 / 64 pad bank、scale filter、per-note velocity、strum、copy / paste、内部音源と外部MIDIを備える | desktop / touch共通の大きなpad、pad単位のstrum / velocity preset、bank copyを後段候補にする |
| Target DAW | Studio One Chord Track | chord audition、Chord Track、instrument / audioのFollow Chords、automatic detectionを持つ | 専用plugin連携より先に、tempo付きmulti-track Standard MIDIとWAV / STEMSを安定handoffにする |

## 一次資料

- Steinberg: [Chord Pads](https://www.steinberg.help/r/cubase-pro/15.0/en/cubase_nuendo/topics/chord_pads/chord_pad_controls_r.html)、[Chord Assistant](https://www.steinberg.help/r/cubase-ai/15.0/en/cubase_nuendo/topics/chord_pads/chord_pads_chord_assistant_c.html)、[Pattern Player](https://www.steinberg.help/r/cubase-pro/15.0/en/cubase_nuendo/topics/chord_pads/chord_pads_using_the_pattern_player_t.html)
- Scaler Music: [Scaler 3](https://scalermusic.com/products/scaler-3/)、[Scaler 3 User Guide](https://scalermusic.com/wp-content/uploads/2025/06/Scaler-3-User-Guide-Print-Version.pdf)
- Hooktheory: [Hookpad](https://www.hooktheory.com/hookpad)、[Hookpad User Guide](https://www.hooktheory.com/support/hookpad)
- Audiomodern: [Chordjam](https://audiomodern.com/shop/plugins/chordjam/)、[Chordjam manual](https://audiomodern.zendesk.com/hc/en-us/articles/360020742297-Chordjam-Manual-PDF)
- Mixed In Key: [Captain Chords](https://mixedinkey.com/captain-plugins/captain-chords/)、[Captain Chords guide](https://mixedinkey.com/captain-epic-tutorials/captain-chords-epic-how-to-guide/)
- Ableton: [Live 12 MIDI Tools / Stacks](https://www.ableton.com/en/live-manual/12/midi-tools/)、[Expressive Chords](https://www.ableton.com/en/packs/expressive-chords/)
- Trackbout: [Ripchord](https://trackbout.com/)。補助確認: [MusicRadar overview](https://www.musicradar.com/news/trackbouts-ripchord-lets-you-remix-the-chord-progressions-behind-your-favourite-songs-for-free)
- Laurent Colson: [ChordPolyPad manual](https://dev.laurentcolson.com/medias/chordpolypad/ChordPolyPad.pdf)、[App Store feature list](https://apps.apple.com/us/app/chordpolypad/id694599930)
- PreSonus: [Studio One 4 release history / Chord Track introduction](https://support.presonus.com/hc/en-us/articles/360007401012-Studio-One-4-Version-History-and-Release-Notes)。現在所有するexact Studio One versionでのimport操作はlive gateとする。

## 推奨方式: Guided Pad → Bar Slot

## 品質benchmark

発火境界: 競合の購入判断ではなく、Pattern Boardを「動くが平凡」な状態で止めないための実装gateとして使う。以下は公式機能資料からのplanning calibrationであり、各製品を同一fixtureで実操作したbenchではない。単一総合点は作らず、軸ごとの差を見る。

| Dimension | Cubase | Scaler 3 | Hookpad | Chordjam | Pattern Board target |
| --- | ---: | ---: | ---: | ---: | ---: |
| chord discovery clarity | 5 | 5 | 5 | 4 | 4以上 |
| selected-timbre one-touch play | 5 | 4 | 4 | 5 | 5 |
| voicing / harmonic guidance | 5 | 5 | 4 | 4 | 4以上 |
| 1-bar pattern / arrangement | 4 | 5 | 4 | 5 | 4以上 |
| timbre distinctiveness | 4 | 4 | 4 | 3 | 4以上 |
| edit / undo / save | 5 | 5 | 5 | 4 | 4以上 |
| Standard MIDI / DAW handoff | 5 | 5 | 5 | 4 | 5 |
| desktop / touch / accessibility | 2 | 4 | 3 | 4 | 4以上 |

Rubric:

- 1: absent / 利用不能
- 2: below par / 経路はあるが制作に使いにくい
- 3: table-stakes / 競合なら当然ある水準
- 4: strong / 比較時に明確な長所として選べる
- 5: category-defining / この機能を目的に使う理由になる

Strategic tensionは平均しない。

- `意外な和音の発見`: target 4。stableだけでなくcolor / surpriseを説明可能な形で提示する。
- `決定論的な編集・持ち出し`: target 5。押した音、保存したsymbolic block、再生、MIDI出力が同じ意味を保つ。

完成gate:

- 全8軸が3以上になるまでtechnical vertical slice扱い。
- selected-timbre one-touch playとDAW handoffは5を要求する。
- discovery、voicing、pattern、timbre、edit、touchは4以上を要求する。
- 自動証拠だけでは★3。ユーザー実操作で比較上の弱点が解消した後に★4、その後のAI最終調整後に★5とする。

### 1. Harmony strip

- 最初は4または8個の1小節slotを横一列に置く。
- slotを選び、chord padを押すと、選択中のinstrumentで即座に和音を鳴らし、同じ操作でslotへ確定する。
- 確定後は次slotへcursorを進める。置換は同じ操作、取り消しは既存undo / redoを使う。
- harmony slotを音楽的な正本とし、再生・bass追従・MIDI出力の全てが参照する。

### 2. 12-pad bank

- `基本`: key内で安定するdiatonic chord。
- `彩り`: seventh、add9、sus、inversion等。大きく外れず、音色やvoicingで個性を出す。
- `意外`: borrowed chord、secondary dominant、bVII等。前chordからの接続とvoice-leadingで順位付けする。
- 各padには大きなchord symbol、degree、短い性格label、voicing名を表示する。色は既存Night Grid規則どおり操作yellowと音楽data pastelを混ぜない。

### 3. Deterministic suggestion

- opaqueな生成AIではなく、key compatibility、一般的な遷移、前後voice-leading距離、novelty bandをscoreする。
- 同じProject / slot / padでは同じnoteを得る。variationを使う場合もseedとpattern IDを保存する。
- chord padの即時発音は配置済みtimeline再生を経由せず、専用の短いaudition planを使う。

### 4. Harmonyとperformanceの分離

- chord symbol / degree / voicingをharmony sourceとする。
- 1小節patternは`hold`、`quarter pulse`、`syncopated`、`pluck`等の演奏方法として別選択にする。
- Chord、Bass、Arpはharmonyへ追従する。Drumはkeyに追従せず、section energy / roleだけを参照する。
- 60分editorで深く編集するときは`ノートに展開`し、既存NoteEventへmaterializeする。展開前はpatternを正本、展開後はmanual noteを正本として二重正本を避ける。

### 5. Timbre / layer contract

- chord padのauditionとtimeline再生は必ず選択中のchord instrumentを使う。
- 最初の内蔵chord layerは、前面用`Bright Supersaw Stack`、短い`Glass Pluck`、補強用`Soft Wide Pad`の少なくとも3系統にする。
- instrument名だけでなく、oscillator layer数、detune、filter envelope、attack / release、stereo spreadを変えて音響差を作る。
- pattern候補には適合tagを付ける。Supersawはhold / sidechain pulse、Pluckはsyncopated / arp、Padはslow holdを優先する。
- license未確認sampleは追加せず、最初はWeb Audio synthesisで再現可能にする。

## 最小受入journey

1. D major / 150 BPMのProjectを開く。
2. Bright Supersaw Stackを選び、4つのslotへpadを押して和音をその場で聴きながら進行を作る。
3. 2つ目のslotを`彩り`または`意外`のchordへ置換し、前後が滑らかなvoicingで鳴る。
4. instrumentをSoft Wide Padへ変えると、同じharmonyのままpad auditionとloop再生の音色が変わる。
5. chord performance patternをholdからsyncopatedへ変える。
6. 保存・再読込後もchord、voicing、pattern、instrumentが同じ。
7. Standard MIDI Format 1へ書き出し、tempoとChord laneのnoteをparserで確認する。Studio One実importはユーザー所有環境の別gateにする。

## 採用しない組み合わせ

- 無制約random chordをprimaryにしない。再現性と利用者の理解を失うため。
- 64個以上のpadを最初から常時表示しない。発見性より選択負荷が勝るため。
- 1つのpad色へ「押せる」「chord degree」「適合度」を同時に載せない。既存interaction color grammarと競合するため。
- Humming / ACEを削除しない。ただしpattern-first journeyが安定するまでprimary完成線から外す。
