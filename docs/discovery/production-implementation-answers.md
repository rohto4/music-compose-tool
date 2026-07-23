# Production Implementation Answers

## 文書状態

`Confirmed by user / 2026-07-22`

この文書は、Pastel Patchboardをfake prototypeから実際に曲を作れるWeb / PWAへ進める際の追加回答を、回答、実装上の帰結、未検証に分けて記録する。

## 完成線

### 回答

- 現行Pastel Patchboard UIで操作可能に見える機能をfakeではなく実動作にする。
- 複数project作成、1 tap音色試聴、音のピース配置、展開編集、microphone鼻歌録音、pitch / rhythm音符化、鼻歌をseedにした伴奏、DAW-like編集、undo / redo、manual save / reload、WAV / MIDI書き出しを含める。
- Cloudflare経由の外部公開とSNSへのactual postは今回行わない。
- microphoneとlocal AIの実行、project-local npm dependency導入、Basic Pitch、ACE-Step local API、local dev serverを許可する。

### 実装上の帰結

- Phase 1はlocal Web / PWAとして完成させる。public deploymentの完了とは表現しない。
- browser内の編集可能なsymbolic projectを正本にし、AIのflat audioは追加layerに限定する。

## 鼻歌と伴奏

### 回答

- 鼻歌由来melodyのpitch / rhythmを極力維持する。
- 事前のchordと鼻歌が合わない場合、鼻歌を優先してchord / accompaniment側を合わせる。
- 一曲全体ではなく、30秒以内の短い範囲を繰り返し録音する。
- 録り直しと複数take比較を行えるようにする。
- AI伴奏はchord、bass、drums等を個別編集できるtrackとして生成する。
- ACE-Stepの完成音声候補はreferenceではなく追加audio layerとして利用できるようにする。

### 実装上の帰結

- humming transcription後にmelody lockを既定にし、harmonizerがbarごとのchord候補を選ぶ。
- Basic Pitch結果は確定値ではなく、confidence付きnote候補としてpiano rollで修正できるようにする。
- text-to-musicだけのAI結果を「鼻歌を厳密に保持した」と表示しない。

## Track、lane、DAW編集

### 回答

- 各instrumentにlaneが1本だけでは不足する。少なくともmain laneとsub laneを持たせる。
- multiple selection、copy / paste、range loop、track追加、volume、pan、mute、solo、tone交換、simple FXを含める。
- automationも含める。MPEとexternal VST pluginは今回含めない。
- MIDI file exportに加えてMIDI inputも扱う。
- precision note editをsmartphoneへ要求しない。WindowsのWQHD / Full HDを第一対象にする。

### 実装上の帰結

- note editorはdesktop-firstとし、mobileではproject、asset、arrangement、playback等へ到達できるdegraded workspaceを提供する。
- track mixerとautomation dataをproject正本へ保持する。

## Sound source、asset、input

### 回答

- built-in synth、generated drums / FXを中心にし、userがWAV / MP3を追加できる形でよい。
- Studio Oneの用意済み音源は、license上許される場合は積極的に使いたい。
- AIのイメージ入力はtext、選択式mood、spoken instruction、reference audioをすべて含めたい。

### 実装上の帰結

- Studio One専用containerやpresetを許諾未確認のまま解析しない。明示的にbounceしたWAV / MP3を`user-owned-export`として扱う。
- spoken instructionとreference audioはlocal assetとして保持できるようにする。外部speech APIは別承認がないため呼ばない。

## Saveとexport

### 回答

- browser内project一覧へのmanual saveと、持ち運べるproject file downloadの両方を用意する。
- autosaveは行わず、dirty状態でtabを閉じる際にwarningを出す。
- master WAV、track WAV stem、standard MIDI file、再編集用project fileをexportする。

### 実装上の帰結

- IndexedDBはSave button成功時だけ更新する。編集途中の自動永続化はしない。
- project bundleにはlicense上bundle可能なuser assetだけを同梱する。

## Runtime

### 回答

- ACE-Stepは生成時だけloadし、job完了後にGPU memoryを解放する。
- 既存の1 process peak reserved VRAM 10,240MiB hard capを維持する。

### 未検証

- ACE-Step追加layerが鼻歌melodyへ主観的にどこまで追従するか。
- spoken instructionの完全local transcription方式。
- Studio Oneの個別content / Sound Setごとの利用許諾。
- Windows Chrome / Edge以外の実browserとactual MIDI device。

## Two production surfaces

### 回答

- 既存の4 workspaceを持つPastel Patchboardとは別に、鼻歌を入口として一曲を生成する専用flowを作る。
- 鼻歌、自然言語の雰囲気、参考音を入力し、伴奏、main instrument、展開、FXを生成してから自然言語と細部編集で整える。
- Project Homeで鼻歌から始める入口を一目で見つけられるようにする。
- 現在のprototypeにあるAI窓口とmelody編集の壊れた情報設計はproductionへ引き継がず改善する。

### 実装上の帰結

- `Humming Studio`と`Patchboard Workbench`を別route / pageとして構成する。
- 両surfaceはdomainとaudio engineを共有し、Humming Studioの結果をPatchboard / DAW editorへhandoffする。
