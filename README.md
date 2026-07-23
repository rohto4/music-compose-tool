# music-compose-tool

クリック中心で音のセットを組み合わせ、少量のボイス入力も使って短時間で曲を作るツールの準備PJです。

現在は `Phase 1: local production implementation / pattern-first refocus` です。Project Homeには、編集可能な曲の土台を先に作る`AI Starter`、即時発音するコードパッドで組む`Pattern Board`、experimentalな`Humming Studio`の3入口があります。制作は`ラフ制作`と既存DAWを保持した`カスタマイズ`の2段です。Pattern Boardは60 tonal音色、全14コードの`Harmonic Atlas`、用途タグ付き9進行、6種類のKawaii伴奏フレーズ、全曲key変更、8分音符単位でAUTO配分する4 / 8 STEP、上限なく追加できる4小節phraseを持ちます。音のピースは合計136 profile（Drum 20、Percussion 8、FX 24、Transition 24）で、Bass / Arp各10種とDrum 22種、合計42の4小節patternをその場で試聴・適用できます。コード進行、phrase、role pattern、音のピース、24種類の加工済みFX / Fillはclickとdrag & dropの両方で4小節へ挿入できます。コード譜→Harmonic Atlas→挿入棚が初期順で、主要sectionはhandleまたは上下buttonで並べ替えて端末保存・初期化できます。曲の設計にあるlicense確認済み6曲starterは、Melody / ChordsにBass / Drums / Pad / Arp / Synthを重ねた16小節の編集可能なDTM arrangementです。desktopは8小節／譜面行、smartphoneは4小節／段で縦に読み、コード譜、ABC、Instrumental-only Creative Brief、JSON、`.mctproj`へ持ち出せます。スマホChord Padは押している間だけ和音をsustainします。色は同じlayoutの`Dark Pastel Studio`、`Vanilla Pastel`、`Friendly Signal`を切替できます。どの入口も同じNoteEvent、Standard MIDI、DAWへ合流します。

Local development: `npm.cmd run dev` → `http://127.0.0.1:4173/`（PowerShellのexecution policy環境では`npm`ではなく`npm.cmd`を使います）。

Local AI gateway（任意）: 別ターミナルで、編集可能なTemplate / Rule fallbackだけなら`npm.cmd run gateway`、検証済みlocal ACE-Step追加レイヤーを使う場合は`npm.cmd run gateway:ace`を実行します。healthは`http://127.0.0.1:17321/health`。選択した鼻歌takeは一時mono WAVへ正規化してACE-Step `complete` taskへ渡します。gateway停止時はUIをofflineと表示し、symbolic伴奏を維持します。1 processの実測peak reserved 9,624MiB / hard cap 10,240MiBです。

検証: `npm.cmd run check`（lint warning 0、typecheck、Vitest 31 files / 132 tests、gateway smoke、production build、機能マトリクス44行・100 local links）、Chromium全15 journey（共通drag挿入、section順序保存、設定、多層starter、Sound Chunk、全曲再生、WAV / STEMS / MIDIを含む）を単一runでpassし、`npm.cmd run test:dark`、`npm.cmd run test:pwa`もpassしています。WQHD 2560×1440を主証跡に、1920×1080、1648×944、1440×900、768×1024、375×812で3テーマ、6曲starter、6 phrase kit、4 phrase、全14コード、全42 role pattern、A0〜C8の88鍵wheel-scroll DAW、responsive Mixer、横overflow 0を確認しています。機能ごとのUI・実装・動作・テスト・外部gateは[`docs/imp/phase1-feature-progress-matrix.html`](docs/imp/phase1-feature-progress-matrix.html)で確認できます。

Misskey投稿は画面の明示クリック後に入力したinstance URLと一時tokenだけを送信します。tokenは保存しません。X OAuth、実MIDI機器、PWA install prompt、Studio One専用音源の直接読込は外部確認またはライセンス確認の境界です。

Repository: `https://github.com/rohto4/music-compose-tool.git`

最初に読む順番:

1. `AGENTS.md`
2. `PROJECT.md`
3. `tech-stack.md`
4. `docs/README.md`
5. `docs/imp/imp-tasks.md`
