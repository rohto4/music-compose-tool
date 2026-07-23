# ユーザー作業

現時点で実行が必要なaccount作成、secret登録、外部resource作成、deploy等のユーザー作業はありません。

Home inferenceのlive E2Eへ進むときだけ、次を別承認・確認する。

- 利用するCloudflare accountとactive domain。
- Access loginをCloudflare identity、OTP、既存IdPのどれにするか。
- home PCのsleep / wake方針と、`cloudflared` / gatewayをservice化するか。
- audio input / resultをhome diskだけに置くか、private R2を使うか、retention期間をどうするか。

現段階では作成・設定しない。

## Phase 1 external verification

local実装は次の情報なしで継続する。adapterとfake HTTP contractが完成した後、actual postを確認するときだけ別途必要になる。

- Misskey: user-owned instance URL、test用access token、投稿してよいtest文面とvisibility。
- X: direct APIを使う場合のdeveloper project / OAuth credential、投稿してよいtest文面。share intentだけならcredential不要。
- Web MIDI: actual device名とbrowser permission。

credentialはrepository、project file、screenshot、test artifactへ保存しない。

## Phase 1 local user verification

- Project Homeで保存済みProjectとstarterを再生し、先頭、±30秒、任意位置、停止が曲を開く／適用する前の比較に役立つか確認する。別曲へ移ったとき前の音が止まることも聴く。
- `02 展開を整える`を開き、共有INSERT TARGETの選択PHRASEとコード譜を見たまま、`コード・音色 / コードセット / 伴奏 / FX・Fill / 音色割当`の5 source tabを切り替えられるか確認する。
- コード進行、伴奏phrase、Bass / Arp / Drum、音のピース、`シュワーーー→ドン`等の複合FX / Fillをカードから任意PHRASEへdragし、click挿入と同じ結果になるか確認する。
- Drum 20音色、FX 24音色、Transition 24音色、24 Sound Chunk、Drum 22 patternを順に試聴し、名前だけでなくkit、方向、長さ、終端impact、fill密度の違いが耳で分かるか確認する。
- `02 展開を整える → 伴奏`で表示される上位2候補と一致理由が、対象section、Mood、コード進行、現在音色に対して納得できるか確認する。Cloud Intro、Candy Verse、Soda Build、Prism Drop、Bubble Break、Hyper Finaleも別々の4小節へ挿入し、用途・energy・厚みの差、Melody保護、1回のUndoを聴く。
- 6曲starterを順に全曲再生し、原曲Melodyを追いながらBass / Drums / Pad / Arp / Synthがsectionごとに増減するか確認する。自動proofは7 role・16小節・境界を確認済みだが、DTMらしい完成感はユーザー実耳の★4待ち。
- `02 展開を整える → FX・Fill`でシャラララン、Music Box、Pizzicato、Chime、Riser、Impactを試聴・挿入する。複数音を選択して塊として保存し、別小節へ再挿入してからProject fileを保存・読込する。
- 設定modalでshortcutを1つ変更し、Ctrl+S / Z / Y、Ctrl+click、Shift octave、Alt 1小節移動が普段の操作感に合うか確認する。
- Bass / Arp各10種、Drum 22種の全42 patternを試聴し、以前の末尾の口笛状音が消えたか実耳で確認する。原因だった共通`fx-sparkle`はrole auditionから除去済み。

- `02 展開を整える`で、最初の4 phrase＝16小節がコード譜として読めるか確認する。`＋4小節`で追加し、desktopで8小節／行、smartphoneで4小節／段になること、左右矢印の8分音符変更とAUTO配分が予測しやすいかを見る。
- SmartphoneでChord Padを押している間だけ現在音色の和音が続き、指を離す／cancelすると止まるか確認する。46コード、縦型譜面、Promptへ横scrollなしで到達できるかを見る。
- `01 曲の設計 / 02 展開を整える / 03 詳細の編集`の順序が名称だけで理解でき、section編集を残したままpiano rollへ移れるか確認する。03でrulerから途中位置へ移動して再生し、停止位置保持、先頭・section seek、空白drag矩形選択、Shift追加、複数note移動、ghost / delta、undoを実操作する。
- 各`持ち出す`panelと全曲Creative Briefを開き、人向けコード譜、ABC、Markdown、JSON、`.mctproj`が用途を理解できる名前で出力されるか確認する。出力は`Instrumental only / no vocals / no lyrics`を常に含む。
- カラーテーマをDark Pastel Studio、Vanilla Pastel、Friendly Signalへ切り替え、layoutが変わらず、色の柔らかさ／機能roleの見分けやすさ／長時間作業のしやすさを画面名と部品名で回答する。再読込後も選択が残ることを確認する。
- 以上はAI自律確認済みの★3。ユーザーがブラッシュアップ完了と明示するまで、機能別マトリクスのUI / 操作／音楽品質を★4へ上げない。
- `AI Starter`で新規作成し、土台がすぐ鳴るか、Chord / Bass / Drum / Pad / Arp / Synthを別々に編集できると理解できるか確認する。現在のlocal first sliceは生成AI接続ではなく、画面に表示される`Template Harmonizer` fallbackである。
- `02 展開を整える → コード・音色`でVoice Deckの6 family（Chord / Synth / Pad / Lead / Arp / Bass）を切り替え、60 tonal音色をChord Padとして押す。Future Bass / Coreの前面へ出せる尖った音と補強層の音が十分に区別できるか確認する。
- `02 展開を整える → 音色割当`のBass / Arp各10種、Drum 22種のpattern browserを試聴し、密度・跳躍・accent・groove / fillの違いが耳で分かるか確認する。対象phraseを替えて適用し、コード差替え後もBass / Arpが追従するかを見る。Drumを含むMIDIがStudio Oneへ意図したグルーヴで入るかは実耳／実DAW gateとして確認する。
- 46コードを同時表示するHarmonic Atlasで、基本 / 彩り / 意外と、同degreeのPower、sus、dim、6 / 7 / 9 / 11 / 13の関係が分かるか、文字を読み込まなくても1 tapで試せるか確認する。
- 4 / 8 STEPで各コードを左右矢印から8分音符単位へ変え、1拍＋3拍のような進行を02だけで作れるか確認する。
- `MIDI譜面を編集`で既存60分DAWへ進み、入口をまたいだ移動が自然か確認する。60分DAWは採用継続だが正式review前の★3であり、削除・完成扱いしない。
- start card、asset、chord pad、section、Canvas noteをhover / dragし、今つかんでいる対象、drop候補、move / resizeの区別が十分明確か確認する。
- 上記は★3のユーザー待ち。部品単位の指摘を反映し、ユーザーがブラッシュアップ完了と明示した後だけ★4へ進める。
- 更新されたDark Pastel画面で、青紫・藤・青緑の面が真黒より柔らかく感じるか確認する。yellow outlineを「押せる／変更できる」と認識でき、矩形tab、丸いP/H、pill音色、keycapコードの形が役割理解に役立つか、画面名と部品名で回答する。
- このUI確認は★3のユーザー待ち。ユーザーがブラッシュアップ完了と明示するまで★4へ進めない。
- 現在のProjectで鼻歌をMelodyへ適用した後、`追加レイヤーを生成`を再実行し、offline表示ではなくACE-Step layer追加まで完了するか確認する。
- 生成音を聴き、Future Bass / Coreらしさ、鼻歌melodyの残り方、追加layerを重ねたときの使いやすさを回答する。
- この確認が終わるまでACE-Step UI / 操作のmatrix scoreは★3。ユーザーのブラッシュアップ完了後だけ★4へ進める。
