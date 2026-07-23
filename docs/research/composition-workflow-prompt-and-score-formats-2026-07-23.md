# 作曲workflow・Prompt・コード譜形式調査

日付: 2026-07-23  
状態: 一次資料確認済み / Product判断へ反映

## 調査した問い

1. 10分／30分／60分の3段階を、ラフ／カスタマイズの2段階へまとめて不自然ではないか。
2. section単位編集を残す根拠はあるか。
3. コードsymbolと各コードの長さを平文で交換できる形式は何か。
4. 外部生成アプリとlocal AIへ渡す設計書をどう分けるか。
5. 歌詞なし・歌声なしをどう一貫させるか。

## 一次資料から確認できたこと

### 作曲のラフ段階

- Ableton Learning Musicは、beats、basslines、chords、melodies、song structuresを小さな音楽要素として段階的に組む教材構成を採る。Basslineはコードを補強しつつ、drumと関係するrhythmを持つと説明している。
- この順番は唯一の作曲手順ではないが、Patchtoneの「大きな音楽blockを耳で選び、コード・低域・beat・主線・曲構成を早く決める」ラフ制作と整合する。

### 精密編集の段階

- Ableton LiveのArrangement Viewは、曲全体をlinear timelineへ並べる面であり、移動・resize以外の編集をselection-basedと説明する。背景dragによるtime range、Shiftによるselection拡張、gridへのsnap、selectionのnudge等を備える。
- したがってPatchtoneのカスタマイズmodeは、単note編集だけでなく、矩形範囲選択、複数note一括移動、drag中preview、keyboard代替を持つ必要がある。

### section編集

- Logic ProはArrangement Markerを使ってsectionを整理し、markerの移動・copy時に配下のregionとautomationを一緒に移せる。Intro / Verse / Build / Drop等を直接扱うPatchtoneのsection編集は一般的DAW概念から外れていない。
- Patchtoneでは専門用語を知らない利用者へ曲構成を露出する強みとして、section編集をラフmodeへ残す。

### sectionと音の配置を同じ曲として読むUI

- Ableton LiveのSession Viewはtrackを縦列、sceneを横行としてclipを配置し、scene launchで同じ行のclipをまとめて開始する。Logic ProのLive Loopsもcellをgridへ置き、scene triggerで行をまとめて再生する。どちらも「音色cardの横並び」ではなく、trackと時間／sceneの二軸で音の参加位置を示す。
- Patchtoneは同じUIを複製せず、初心者向けの読み順に合わせてtrackを行、Intro / Verse / Build / Drop等のsectionを左から右の列へ置く。各cellはそのtrackがsectionのMain / Subへ参加する場所とし、音色選択はAudio Paletteへ分離する。
- section追加は独立した種類別button群にせず、時間レールの末尾へ空slotを置く。左から右の接続、連番、末尾slotによって、現在の順序と次に増える位置を文字説明なしでも読めるようにする。
- scene / clip型UIの重要な手掛かりはlaunch結果と現在位置であり、英字eyebrowや重複subtitleではない。現在section、選択track、配置済みcell、再生状態を固定し、それらだけで役割が自明なsurfaceでは表示titleを段階的に外す。

### コード譜の共通テキスト形式

- ABC 2.1は`M:`で拍子、`L:`で基準音価、`Q:`でtempo、`K:`でkey、小節線`|`、引用符付きchord symbol、音価倍率を平文で表せる。
- `M:4/4`、`L:1/8`とし、restをtiming carrierに使えば、付点4分は3 eighthsとして記述できる。Patchtoneでは人間向けbar chartを併記し、ABCを共通テキスト譜にする。
- MusicXML 4.0はdigital sheet music交換・archive向けのopen formatで、harmonyとdurationを詳細に表せる。一方、生成AIへ貼る平文としては冗長なので今回のprimary出力にせず、将来のnotation app連携候補とする。

### 外部生成アプリ

- SunoのCustom modeはInstrumental設定、Styles、Title等を入力する。Prompt文だけで歌詞なしを期待せず、外部app側のInstrumental modeをONにする案内と、Prompt内の`Instrumental only / no vocals / no lyrics`を併用する。
- 外部appごとの非公開parameterへ依存せず、Markdown Creative Brief、人間向けChord Chart、ABC、local AI向けJSON、元Project `.mctproj`を同じProjectから生成する。

## 採用判断

### 二段workflow

1. `ラフ制作`: 曲の条件、Chord Score、音色role、音のピース、section、試聴、Creative Brief。
2. `カスタマイズ`: whole-song DAWでnote / timing / length / velocity / track / mixをselection-basedに精密編集。

30分整形を独立modeにしない。必要なsection編集はラフへ、精密操作はカスタマイズへ統合する。

### 出力

- 人間／外部生成アプリ: `.md` Creative Briefと短いPrompt。
- コード譜: 読みやすいBAR chartと`.abc`。
- local AI: version付き`.json`。`instrumentalOnly: true`、`allowLyrics: false`、`allowVocals: false`を明示する。
- 復元と安全保存: `.mctproj`。browser IndexedDBだけを保存経路にしない。

### smartphone

- smartphoneは精密DAW全機能の再現を完成条件にしない。
- Chord Padのhold-to-sustain、4小節ごとの縦譜、phrase追加、長さ編集、Prompt copy / file共有をprimaryにする。

## 参照

- [ABC standard 2.1](https://abcnotation.com/wiki/abc%3Astandard%3Av2.1/)
- [MusicXML 4.0](https://www.w3.org/2021/06/musicxml40/)
- [MusicXML harmony element](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/harmony/)
- [Ableton Learning Music](https://learningmusic.ableton.com/)
- [Ableton Live 12 Arrangement View](https://www.ableton.com/en/manual/arrangement-view/)
- [Ableton Live 12 Session View](https://www.ableton.com/en/manual/session-view/)
- [Ableton Live 12 accessibility and keyboard navigation](https://www.ableton.com/en/live-manual/12/accessibility-and-keyboard-navigation/)
- [Logic Pro arranging overview](https://support.apple.com/guide/logicpro/arranging-overview-lgcpf7c0a8b1/mac)
- [Logic Pro arrangement markers](https://support.apple.com/en-gb/guide/logicpro/lgcpf7c0a3d7/10.7/mac/11.0)
- [Logic Pro Live Loops cells](https://support.apple.com/en-mide/guide/logicpro/lgcpb461e752/mac)
- [Logic Pro scene editing](https://support.apple.com/en-lamr/guide/logicpro/lgcpcbbf7054/mac)
- [Suno Custom Mode](https://help.suno.com/en/articles/3726721)
