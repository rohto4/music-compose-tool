# 編集可能な既製曲スターターのライセンス調査

日付: 2026-07-23

## 採用境界

- 録音済みaudioや市販sampleを同梱せず、譜面・MIDIとして改変可能なsourceだけを候補にする。
- 作曲物のpublic-domain状態と、譜面データ／編曲物のlicenseを分けて確認する。
- アプリには外部MIDIをそのまま転載せず、短い学習用のMelody / Chord / Sectionを新規にsymbolic encodingする。source URL、license、maintainer attributionはpresetに残す。
- Starter適用はMelody、Chords、Arrangement、Key、BPMを1 history unitで置換する。既存の音色選択と手動Mixer設定は保持し、置換範囲をbutton前に表示する。

## 一次資料

Mutopia Projectは、公開楽譜をPDF、MIDI、LilyPondで配布し、各piece pageに個別のcopyright / licenseを表示する。サイト全体の一般説明だけで一括許諾とは判断せず、次の各pageの表示を採用根拠にした。

| Starter | Source | Page表示 | アプリ内での扱い |
| --- | --- | --- | --- |
| Ah vous dirai-je, Maman · Theme Study | [Mutopia 2236](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2236) | Public Domain。W. A. Mozart、edition / maintainer Jeffrey Olson | 主題の8小節を新規入力し、16小節の編集starterとして反復 |
| Ode to Joy · Theme Study | [Mutopia 528](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=528) | Public Domain。L. V. Beethoven、maintainer Peter Chubb | 歌詞を含めず主旋律だけをinstrumental NoteEventとして新規入力 |
| Canon in D · Harmony Study | [Mutopia 2047](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2047) | Creative Commons Attribution 4.0。maintainer Michael Fischer v. Mollard | 8和音循環と縮約arpeggioを学習用に再構成し、attributionをUIへ保持 |
| Prelude in C · Arpeggio Study | [Mutopia 2206](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2206) | Public Domain。J. S. Bach BWV 846、maintainer Jeffrey Olson | 分散和音の形と和声の移動を学ぶ16小節の縮約study |
| Eine kleine Nachtmusik · Motif Study | [Mutopia 2230](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2230) | Public Domain。W. A. Mozart KV 525、maintainer Mike Blackstock | 主題と応答をsectionへ分けた簡略motif study |
| Symphony No. 5 · Rhythm Motif Study | [Mutopia 941](https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=941) | Public Domain。L. V. Beethoven Op. 67、maintainer Stelios Samelis / Johannes Heinecke | 短短短長のリズム動機を通常NoteEventとして編集するstudy |

Mutopiaのcontribution / license説明では、sourceの著作権状態を確認し、Public Domain、CC BY、CC BY-SA等の選択肢をpiece単位で扱っている。[Mutopia contribution and copyright guidance](https://www.mutopiaproject.org/contribute.html)

## 今回同梱しないもの

- streaming serviceや市販音源から抽出した録音
- license表示のないMIDI、出所不明のファン編曲
- ShareAlike条件を満たす配布設計をまだ用意していない譜面データ
- 歌詞、歌声、spoken word

## 今後の拡張条件

件数を増やす際も、曲名違いの同一進行で水増ししない。Baroque arpeggio、classical motif、folk melody、waltz等、section、旋律運動、和声、編集課題が異なるstarterを優先し、各piece pageと生成したsymbolic dataの対応をtest fixtureで固定する。
