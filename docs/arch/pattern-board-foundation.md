# Pattern Board Foundation

## Status

`Accepted product direction / multi-phrase Chord Score, AI Starter convergence, and 15 harmony-follow role patterns implemented / user review pending`

編集可能なsymbolic foundationを先に作るAI Starterと、決定論的な1小節pattern / chord padを手で組むPattern Boardをprimary制作基盤にする。既存Humming Studioは削除せず、experimental third entryとして保持する。

既存の60分DAW詳細編集surfaceはこのArchitectureで置き換えない。Pattern Boardを決定論的な下書き入口、60分DAWをNoteEventへ展開した後の詳細編集先として接続し、ユーザーレビューが完了するまで既存UI / 操作を★3で保持する。

根拠比較: `docs/research/chord-pad-pattern-workflow-benchmark-2026-07-22.md`

## First outcome

音楽理論や鍵盤演奏を前提にせず、選択中の音色でchord padを押している間だけ和音を聴き、4小節phraseを上限なく並べたコード譜を作る。patternとinstrumentを差し替え、ABC / Creative Brief / MIDIで外部AIやStudio Oneへ渡せる。

## Three-entry convergence contract

| Entry | Initial source | Shared destination |
| --- | --- | --- |
| AI Starter | editable starter melody + symbolic Chord / Bass / Drum / Pad / Arp / Synth | Pattern Board、60分DAW、Standard MIDI / WAV / STEMS |
| Pattern Board | versioned MusicBlockをNoteEventへmaterialize | 60分DAW、Standard MIDI / WAV / STEMS |
| Humming Studio | raw take + Basic Pitch NoteEvent + generated accompaniment | Pattern Board、60分DAW、Standard MIDI / WAV / STEMS |

entry固有の別project形式を作らない。全入口が既存Project / Track / Lane / MusicBlock / NoteEventを使う。AI Starterはflat audioだけを正本にせず、実際に使用したrouteをGeneration Candidateへ記録する。Home AI unavailable時はTemplate Harmonizerへ明示fallbackする。

Pattern Boardで1小節を差し替える場合、pattern blockが被覆するtick範囲のgenerated chordだけを置換し、未編集小節のAI / rule generated chordを残す。詳細編集へ明示展開した範囲はmanual NoteEventを正本にし、同じ範囲のblockと二重再生しない。

## Interaction contract

1. Projectのkey / BPMを参照する。
2. 4 / 8個のprogression stepから現在位置を選び、各step拍数を8分音符単位で変更する。各phraseは常に16拍＝4小節で、少なくとも1つのAUTO stepが残り拍を吸収する。
3. 基本7 degreeを主軸、彩り・意外を関連degreeへ接続したHarmonic Atlasからchordを押す。全候補は同時表示し、bandは属性labelとして示す。
4. pad pointerdownは選択中のchord instrumentでsustained audition sessionを開始し、pointerup / cancel / lost captureで停止する。keyboardは有限auditionへfallbackする。
5. 同じ操作で選択slotへchord pattern blockを追加または置換し、cursorを次slotへ送る。
6. 4小節phraseを追加・削除し、desktopは8小節／譜面行、smartphoneは4小節／段の縦型譜面として読む。全曲loopはphrase連結から求める。
7. Bass / Arp各10種、Drum 22種のrole browserから対象phraseを4小節試聴し、1 tapで対象role Main laneへ適用する。
8. コード、進行template、伴奏phrase、role pattern、内蔵asset、user audio、複合FX / Fillはclick / tapとdrag & dropを同じcommandへ接続し、互換する4小節phrase / stepだけをdrop先として示す。
9. コード譜、Harmonic Atlas、挿入棚の初期順を持ち、主要sectionは専用handleまたはkeyboard上下buttonで端末ごとに並べ替え、初期配置へ戻せる。
10. loop再生、instrument差替え、rhythm pattern差替え、undo / redo、ABC / Creative Brief出力を行う。
11. カスタマイズへ進むとpatternをNoteEventへmaterializeしてDAW editorで編集する。

鍵盤UI、配置済みtimelineの再生だけによる疑似試聴、固定piano音でのpad previewは最低要件を満たさない。

## Source of truth

### Pattern definition

Project外のversioned catalogとして保持する。

- `patternId`
- `role`: chord / bass / arp / drum等
- `scope`: chord stepまたは4小節role phrase。全曲へ一括適用せず選択phraseを単位にする
- `compatibleTimbreTags`
- note step、duration、velocity、accent。chord系はvoice indexまたはroot-relative ruleを使う

### Pattern instance

既存`MusicBlock`をfirst sliceで再利用する。

- `assetId`: version付きpattern / chord identity
- `startTick`: phrase offset + slot先頭
- `durationTick`: 最小8分音符、最大は他stepへ最小単位を残せる範囲。既存blockは`4 * PPQ`の4拍として互換読込する
- `granularity`: `draft`

blockはsymbolic sourceとし、再生・MIDI export時に決定論的にNoteEventへ展開する。ユーザーが`ノートに展開`した後はmanual NoteEventを正本にし、元blockを再生成対象から外す。blockとmanual noteを同時に正本にしない。

### Harmony-follow role pattern

- Bass / Arpは各10種、Drumはgroove / fillを含む22種、合計42種をProject外のversioned catalogへ置く。名前だけでなく発音位置、長さ、octave / chord tone、velocity / accentの複数軸を変える。
- Bassは各chordのroot、Arpはroot-position chord toneを参照し、Chord Score差替え後に未編集generated noteを再生成する。Drumはpitch harmonyへ依存せず、同じ4小節phraseのtick境界へ整列する。
- 適用結果は`role-pattern|v1|role|pattern|phrase|note` identityを持つ通常NoteEventとし、save / reload、undo / redo、Web Audio、WAV / STEMS、Standard MIDIへ既存経路で渡す。
- phrase scoped commandは対象roleのMain laneかつ対象phrase内だけを置換する。他phrase、他role、Melody、Humming、user audio、user-edited noteを削除しない。
- 旧patternのuser-edited noteを残したまま新patternへ替えた場合、表示とharmony再追従は新しい未編集patternを正本とし、旧pattern全体を再生成しない。

stepの`startTick`はphrase offsetと前stepまでのduration累積値とする。拍数変更は編集対象を固定し、他の1 stepをAUTOへして残り拍を吸収する。同一phraseのpattern blockを1 commandで再flowし、phrase合計を常に`16 * PPQ`へ固定する。loop endは`phrase count * 16 * PPQ`とし、再生、MIDI、save / reloadへ同じ値を渡す。空stepはUI上の拍数を保持して後続位置を決めるが、Projectへ架空blockは保存しない。AUTO step自身を編集した場合は別stepへAUTO役割を移す。三連符はこのsurfaceへ入れない。

## Chord model

Pad catalogは少なくとも次を保持する。

- key rootからのroot offset
- chord quality / intervals
- degree label / chord symbol
- discovery band: stable / color / surprise
- voicing policy
- short character label

前slotがある場合、複数inversion / octave候補のうち、voice movementとrange penaltyが最小のものを選ぶ。最初のsliceでは同じ入力から常に同じvoicingを得る。

## Timbre model

内蔵音はpreset名だけでなく、synthesis profileを持つ。

- oscillator layer / waveform
- detune cents
- relative gain / octave
- filter frequency / resonance
- attack / decay / sustain / release
- stereo spread
- role tags: foreground / support / pluck / pad / bass等

最初のchord timbreは次の3系統を最低限とし、vertical slice後は役割別bankへ拡張する。

1. `Bright Supersaw Stack`: Future Bassの前面、複数saw、detune、短いattack。
2. `Glass Pluck`: 短いdecay、syncopated pattern向け。
3. `Soft Wide Pad`: supporting layer、遅いattack、長いrelease。

外部sample / font / presetはlicense確認まで追加しない。

Chord Pad専用の別音源bankを複製せず、synthesis profileを持つ60 tonal assetをVoice Deckから選べるようにする。元のChord / Synth / Pad / Lead / Arp / Bass categoryをfamily tabとし、選択後はChord track `instrumentId`へ同じasset IDを保存する。Bass系を和音化した場合の低域の濁りはpreset説明で用途を明示し、選択を禁止しない。音のピース全体は136 profileとし、Drum 20、Percussion 8、FX 24、Transition 24を別categoryで扱う。

## Harmonic Atlas visual contract

- degree I〜vii°を左から右へ音階順に置き、現在keyの主軸を作る。
- color / surpriseは同じroot degreeまたは機能的に近いdegreeの上下へ置き、線と列位置で関係を示す。
- `基本 / 彩り / 意外`は全候補に常時付く短い属性labelで、表示を切り替えるtabにしない。
- chord nodeは一般buttonと異なるkeycap輪郭を使い、hover / pressで浮き・沈みを返す。textを読まなくてもbandを輪郭と位置で補助判別できるようにする。
- desktopは2 phrase＝8小節までを1 score rowに置く。mobileは1 phrase＝4小節を1段とし、Harmonic Atlasの14 nodeを7列へ収めてdocument / Atlas双方の横overflowを発生させない。padは44px以上を保つ。

## Portable score / Creative Brief contract

- 人向けchord chartはbar番号、chord symbol、8分音符単位の長さ、AUTO状態を保持する。
- ABC 2.1は`M:4/4`、`L:1/8`、tempo、key、quoted chord symbolとduration carrierを出し、bar境界を欠落させない。
- 全曲Markdownとversioned JSONはtitle、genre、mood、BPM、key、meter、Lead / Melody instrument、role別音色、section、コード譜を同じProjectから作る。
- すべてのAI向け出力へ`Instrumental only / no vocals / no lyrics / no spoken words`を含める。外部appではInstrumental modeをONにする案内を出すが、自動投稿はしない。
- browser保存だけへ依存せず、ABC、Markdown、JSON、既存`.mctproj`をdownloadできる。

## Workflow / theme / detail editor boundary

- `ラフ制作`は曲の設計、Chord Score / 音色、section、Promptを担当し、`カスタマイズ`は保持したCanvas DAWを担当する。mode切替はProject schemaを分岐させない。
- themeは`dark-pastel` / `vanilla-pastel` / `friendly-signal`のtoken setだけを切り替え、端末localStorageへ保存する。Project音楽dataとlayoutは同一にする。
- detail editorは空白drag marquee、Shift additive selection、複数noteのatomic move、drag ghost / tick・semitone delta、snap、cancel、undo / redoを持つ。smartphoneではこのprecision操作を完成条件にしない。

多数とは名前違いの水増しではなく、少なくともforeground chord、pluck、support pad、bass、lead / synth、arpの用途を覆い、各presetのlayer構成、attack / decay、filter、stereo、演奏pattern適性のいずれかが聴感上明確に異なることを意味する。

## Interaction feedback contract

- hover / keyboard focusでは操作対象を2〜4px相当浮かせ、yellow outlineとshadowを加える。
- pointer drag中は対象を`grabbed`として強調し、drop候補は別outlineと補助labelで示す。
- 音楽dataのpastel色だけに操作可能性を依存させず、cursor、動詞label、focus-visible、ARIAを併用する。
- `prefers-reduced-motion: reduce`では位置移動transitionを止めても、outline / shadow / labelで状態を判別できる。

## Existing component reuse

| Existing | Reuse |
| --- | --- |
| Project / Track / Lane / MusicBlock / NoteEvent | slot、pattern instance、detail note |
| ProjectCommand / history | block add / update / remove、instrument変更、undo / redo |
| Role pattern catalog / phrase command | Bass / Arp / Drum 15候補、4小節試聴、部分適用、harmony再追従 |
| Web Audio plan / engine | chord audition、loop playback、role別synthesis |
| IndexedDB / `.mctproj` | pattern blockとinstrumentのmanual save / reload |
| Standard MIDI Format 1 writer | tempo、lane別noteのStudio One handoff |
| WAV / STEMS | browser内renderとaudio handoff |

## First vertical slice acceptance

- D major、4/4、150 BPMで4 slotを表示する。
- 12以上のpadをstable / color / surpriseへ分ける。
- pad pressから選択中timbreの発音までを専用audition pathで確認する。
- 4 chordを配置・置換し、undo / redo、loop再生できる。
- Bright Supersaw / Glass Pluck / Soft Wide Padの音響profileがテスト上も異なる。
- key変更でsymbolic chord blockから再materializeされる。
- save / reload後にslot、pattern、instrumentが維持される。
- MIDI parserでtempo、Chord track、note start / durationを確認する。
- Studio Oneへのactual importはexact versionを確認するexternal user gateとする。
- 4 phrase＝16小節を初期表示し、さらに4小節ずつ追加して全曲loop / MIDIが伸びる。
- 8分音符、付点4分、AUTO再配分を使っても各phraseが16拍を保つ。
- smartphone 375×812でChord Pad、縦型4小節段、Promptへ到達し、横overflowとstuck noteがない。
- ABC、Instrumental-only Markdown、JSON、`.mctproj`をdownloadできる。
- ラフ制作からカスタマイズへ移り、矩形選択した複数noteを1 commandで移動・undoできる。
- 15 role patternをWQHDと375pxで選び、3 roleへ適用、undo / redo、chord差替え追従、save / reload、Drumを含むStandard MIDIを確認できる。

## Failure / stop boundaries

- unsupported meterでは勝手に4/4へ変換せず、first slice非対応を表示する。
- AudioContext開始失敗、permission / unsupported、malformed pattern IDはProjectを変更しない。
- Humming / ACE data、既存Project、manual noteを削除しない。
- license未確認素材、external VST、Studio One proprietary format、public deployは別承認とする。
