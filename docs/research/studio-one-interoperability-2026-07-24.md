# Studio OneとのProject交換境界

調査日: 2026-07-24

## 結論

初期の相互運用線は次のように分ける。

1. Music Compose Tool内の完全保存は`.mctproj`を正本とする。
2. Studio Oneへ編集可能な音符を渡す主線はStandard MIDI File Type 1とする。
3. 響きを固定して渡す主線はmaster WAVまたはtrack別WAV stemsとする。
4. より多くのProject構造を交換する将来候補は、公開specを持つ`.dawproject`とする。
5. Studio One native `.song`の直接import / exportは初期対象にしない。

`.song`はStudio OneのSong folderとmedia、Sound Set、third-party plug-in等の状態と結び付く。PreSonusは別PCへ移す際にSong folder全体、同じcontent、plug-inを揃えるよう案内している。一方、今回確認したPreSonus公式資料には`.song`を第三者が安全に生成・解析するための公開schemaまたは安定parser契約が見つからなかった。したがって「proprietary parserが存在する」と断定するのではなく、**公開された実装契約を確認できないため推測実装しない**という判断にする。

## Format別の交換範囲

| Format | このアプリでの位置付け | 渡せる主なdata | 欠落・注意点 |
| --- | --- | --- | --- |
| `.mctproj` | 現在の完全保存形式 | Project、Track、Lane、NoteEvent、MusicBlock、Arrangement、Mixer、生成候補、参照metadata | Studio Oneは直接読まない。Project Homeの読込は現時点でこれだけ |
| Standard MIDI Type 1 | 現在のStudio One編集handoff | track別note、pitch、start、duration、velocity、drum channel 10、先頭tempo、PPQ 480 | 内蔵Web Audio音色、audio clip、FX、automation、section label、sound designは保持しない。Studio One側でinstrumentを割り当てる |
| master WAV | 現在の確定音handoff | 現在mixを1本のPCM audioとして渡す | note、track、tempo map、音色編集性を失う |
| track WAV stems | 現在のmix handoff | role別に確定音を渡し、Studio Oneで再mixしやすくする | MIDI編集性と内蔵synthesis parameterを失う。effect込み／なしの意味をUIとfile名で区別する必要がある |
| `.dawproject` | 将来候補 | note / audio timeline、tempo、time signature、track / channel、automation、marker、対応plug-in state等 | 両アプリが共通対応するdataだけが再現対象。unsupported plug-in、built-in device、featureは警告し、黙って完全互換と表現しない |
| Studio One `.song` | 非対象 | Studio One native Songの全状態 | 公開schemaを確認できず、media / Sound Set / plug-in / version依存を安全に再現できないため直接生成・解析しない |

## 一次資料から確認できたこと

### Standard MIDI File

PreSonusのMIDI FAQは、Studio OneがType 1のmultitrack MIDIを扱い、Studio One自身のexportはType 1のみであると説明している。tempo mapとsong marker等を含めて別DAWへ渡す場合は`File > Save As...`のMIDI exportを推奨している。また、Studio One browserへのMIDI dropはfile sizeやdrop位置により、現在Songへのtrack importまたは新規Song作成になる。

Music Compose Toolの現行writerはMIDI header format 1、PPQ 480、先頭tempo meta event、role別track、drum channel 10を生成する。Studio Oneへ入れる際は、まず空Songへfileを開くか、Studio One browserでtrack単位に配置する手順を案内候補とする。

一次資料:

- [Studio One: MIDI FAQ](https://support.presonus.com/hc/en-us/articles/360004944692-Studio-One-MIDI-FAQ)

### WAV / stems

PreSonusは`Song > Export Stems`から、Tracks tabではraw audio、Channels tabではmixer channelとeffect chainをprintしたaudioを選べると案内している。この区別はMusic Compose Tool側でも、dry stemと現在mixを将来分ける場合の命名・UI契約として有用である。

一次資料:

- [Studio One - Is there an easy way to export stems in S1?](https://support.presonus.com/hc/en-us/articles/210044093-Studio-One-Is-there-an-easy-way-to-export-stems-in-S1)

### Studio One native Song

PreSonusの共有手順は、`.song` fileだけでなくMedia、Stems、Bounces、Cacheを含むtop-level Song folderをまとめるよう案内している。新しい案内でもexternal audio、Sound Sets、third-party plug-insが別PCで欠落し得ると説明している。これはnative Songが単独fileだけでは完全再現できない場合があることを示す。

一次資料:

- [File Management: Sharing Songs (With Other Studio One Users)](https://support.presonus.com/hc/en-us/articles/210040393-File-Management-Sharing-Songs-With-Other-Studio-One-Users)
- [Studio One Pro 7: Moving Songs Between Computers](https://support.presonus.com/hc/en-us/articles/29973670961421-Studio-One-Pro-7-Moving-Songs-Between-Computers)
- [Studio One 5: Exploring the Save Options](https://support.presonus.com/hc/en-us/articles/360044744812-Studio-One-5-Exploring-the-Save-Options)

### DAWproject

PreSonusはStudio One 6.5 Professional以降で`.dawproject` import / exportを案内している。公開specはZIP container内のUTF-8 XML（`project.xml` / `metadata.xml`）で、version 1.0 stable、MIT Licenseである。native DAW fileになることはnon-goalで、異なるDAW間で変換可能なuser dataを運ぶ形式である。

PreSonus資料はaudio / instrument track、folder、automation、mixer、insert / send、VST2 / VST3 state、marker等を列挙する一方、交換は両DAWが対応する内容へ限定されると明記している。公開specにもaudio、note、automation、plug-in、track / timeline structureが含まれるが、importerが自分のmodelに合わせてflatten / convertしてよいとある。

一次資料:

- [PreSonus: Introducing DAW Project](https://support.presonus.com/hc/en-us/articles/19743606863629-Introducing-DAW-Project)
- [bitwig/dawproject: open specification and schemas](https://github.com/bitwig/dawproject)

## 推奨する実装順

### Stage 0: 現在

- `.mctproj`だけをProject Homeの読込対象として表示する。
- Standard MIDI Type 1、master WAV、track stemsをStudio One handoffとして維持する。
- MIDI / WAV / stemsの自動parse proofを回帰へ含める。
- UIで「Project完全交換」と「MIDI / audio handoff」を混同しない。

### Stage 1: handoff説明の改善

- MIDI exportにStudio Oneでの開き方、track別instrument割当、失われるdataを表示する。
- stemsへrole、BPM、dry / current-mixの意味が分かるfile名とmanifestを付ける。
- MIDIとstemsを同じ開始位置・曲尺へ揃える自動testを追加する。

### Stage 2: `.dawproject`最小export spike

別taskとして、公開XSDへ適合する最小exportだけをfake-firstで作る。

- metadata / application / transport
- note trackとnote clip
- audio trackとembeddedまたはreferenced WAV
- tempo / time signature
- track name / color、volume / pan / mute
- arrangement sectionをmarkerへ写す候補

unsupported項目は`warnings.json`またはexport前summaryへ列挙し、plug-in stateを捏造しない。実Studio One importは自動schema検証の後に別の実機gateとする。

### Stage 3: `.dawproject` import

- ZIP path traversal、size、entry count、XML entity、schema versionをfail closedで検査する。
- note / audio / tempo / marker / mixerの対応subsetだけを新しいProjectへ明示importする。
- unknown device / plug-in / nested structureを欠落warningとして利用者へ示す。
- `.mctproj`へ上書きせず、import previewと新規Project作成を挟む。

## 非目標・停止線

- `.song`のreverse engineering、undocumented binary / XML fieldの推測実装。
- Studio One、Sound Set、commercial plug-inの自動installation。
- user-owned Studio One contentの無断bundle、upload、再配布。
- `.dawproject`がplug-inやbuilt-in deviceを含むという理由だけで「完全再現」を保証すること。
- third-party converterや外部upload serviceを初期の必須経路にすること。
