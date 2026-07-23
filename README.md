# music-compose-tool

クリック中心で音のセットを組み合わせ、少量のボイス入力も使って短時間で曲を作るツールの準備PJです。

現在は `Phase 1: local production implementation / pattern-first refocus` です。Project Homeには、primaryの`パッチボードで組む`、次の`AIで土台を作る → 鼻歌でメロディを追加する`、experimentalな`鼻歌をもとに曲を作る`の3経路があり、選んだ後だけ必要項目を展開します。保存Projectと6曲starterは開く／適用する前に再生、停止、先頭、±30秒、任意位置から試聴できます。

制作画面は`01 曲の設計 → 02 展開を整える → 03 詳細の編集`の3段です。02は4小節の共有INSERT TARGETを常時表示し、`コード・音色 / コードセット / 伴奏 / FX・Fill / 音色割当`の5 source tabを切り替えます。Pattern Boardは60 tonal音色、46コードの`Harmonic Atlas`、用途タグ付き9進行、対象section・Mood・コード・音色に基づく上位2伴奏推薦、8分音符矢印でAUTO配分する4 / 8 STEP、上限なく追加できる4小節phraseを持ちます。音のピースは合計136 profile（Drum 20、Percussion 8、FX 24、Transition 24）、role patternはBass / Arp各10種とDrum 22種です。コード進行、伴奏、role pattern、音のピース、24種類のFX / Fillをclickまたはdragで同じ4小節へ挿入できます。03はWQHD最初のviewportへpiano rollを置き、ruler / playhead、途中位置再生、先頭・section seek、88鍵wheel scroll、Mixerへ同じProjectのNoteEventを渡します。色は`Dark Pastel Studio`、`Vanilla Pastel`、`Friendly Signal`を切替でき、Standard MIDI Type 1、WAV / stems、`.mctproj`へ持ち出せます。

Local development: `npm.cmd run dev` → `http://127.0.0.1:4173/`（PowerShellのexecution policy環境では`npm`ではなく`npm.cmd`を使います）。

Local AI gateway（任意）: 別ターミナルで、編集可能なTemplate / Rule fallbackだけなら`npm.cmd run gateway`、検証済みlocal ACE-Step追加レイヤーを使う場合は`npm.cmd run gateway:ace`を実行します。healthは`http://127.0.0.1:17321/health`。選択した鼻歌takeは一時mono WAVへ正規化してACE-Step `complete` taskへ渡します。gateway停止時はUIをofflineと表示し、symbolic伴奏を維持します。1 processの実測peak reserved 9,624MiB / hard cap 10,240MiBです。

検証: `npm.cmd run check`（lint warning 0、typecheck、Vitest 33 files / 150 tests、gateway smoke、production build、機能マトリクス44行・102 local links）、Chromium全15 journeyを単一runでpassし、`npm.cmd run test:dark`、`npm.cmd run test:pwa`もpassしています。WQHD 2560×1440を主証跡に、1920×1080、1648×944、1440×900、768×1024、375×812で3経路、3制作段階、5 source tab、46コード、6 phrase kit、全42 role pattern、88鍵DAW、Project Home preview、横overflow 0、console / request failure 0を確認しています。46コードはMajor / Minor全92 itemの配置intervalと、V13の試聴・MIDI 6声も横断検証しています。semantic role / accessible nameも回帰していますが、これは完全なWCAG監査の代替ではありません。機能ごとのUI・実装・動作・テスト・外部gateは[`docs/imp/phase1-feature-progress-matrix.html`](docs/imp/phase1-feature-progress-matrix.html)で確認できます。

Misskey投稿は画面の明示クリック後に入力したinstance URLと一時tokenだけを送信します。tokenは保存しません。X OAuth、実MIDI機器、PWA install prompt、Studio One専用音源の直接読込は外部確認またはライセンス確認の境界です。

Repository: `https://github.com/rohto4/music-compose-tool.git`

最初に読む順番:

1. `AGENTS.md`
2. `PROJECT.md`
3. `tech-stack.md`
4. `docs/README.md`
5. `docs/imp/imp-tasks.md`
