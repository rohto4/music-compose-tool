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

- `音を組む`を開き、初期順がコード譜→Harmonic Atlas→挿入棚になっているか確認する。各section左端（smartphoneは右上）のhandleで上へ移動し、再読込相当の再表示後も順序が残ること、`初期配置`で戻ることを確認する。
- コード進行、伴奏phrase、Bass / Arp / Drum、音のピース、`シュワーーー→ドン`等の複合FX / Fillをカードから任意PHRASEへdragし、click挿入と同じ結果になるか確認する。
- Drum 20音色、FX 24音色、Transition 24音色、24 Sound Chunk、Drum 22 patternを順に試聴し、名前だけでなくkit、方向、長さ、終端impact、fill密度の違いが耳で分かるか確認する。
- `音を組む → 伴奏フレーズ`でCloud Intro、Candy Verse、Soda Build、Prism Drop、Bubble Break、Hyper Finaleを別々の4小節へ挿入し、用途・energy・厚みの差が耳で分かるか確認する。Melodyと他phraseが残ること、1回のUndoでkit全体が戻ることも見る。
- 6曲starterを順に全曲再生し、原曲Melodyを追いながらBass / Drums / Pad / Arp / Synthがsectionごとに増減するか確認する。自動proofは7 role・16小節・境界を確認済みだが、DTMらしい完成感はユーザー実耳の★4待ち。
- カスタマイズの`音の塊`でシャラララン、Music Box、Pizzicato、Chime、Riser、Impactを試聴・挿入する。複数音を選択して塊として保存し、別小節へ再挿入してからProject fileを保存・読込する。
- 設定modalでshortcutを1つ変更し、Ctrl+S / Z / Y、Ctrl+click、Shift octave、Alt 1小節移動が普段の操作感に合うか確認する。
- Bass / Arp各10種、Drum 22種の全42 patternを試聴し、以前の末尾の口笛状音が消えたか実耳で確認する。原因だった共通`fx-sparkle`はrole auditionから除去済み。

- `ラフ制作 → 音を組む`で、最初の4 phrase＝16小節がコード譜として読めるか確認する。`＋4小節`で追加し、desktopで8小節／行、smartphoneで4小節／段になること、8分音符・付点4分・AUTO配分が予測しやすいかを確認する。
- SmartphoneでChord Padを押している間だけ現在音色の和音が続き、指を離す／cancelすると止まるか確認する。全14コード、縦型譜面、Promptへ横scrollなしで到達できるかを見る。
- 曲の設計、音を組む、展開を整えるの各`持ち出す`panelと全曲Creative Briefを開き、人向けコード譜、ABC、Markdown、JSON、`.mctproj`が用途を理解できる名前で出力されるか確認する。出力は`Instrumental only / no vocals / no lyrics`を常に含む。
- `ラフ制作`と`カスタマイズ`の役割が名称だけで理解でき、section編集を残したままDAWへ移れるか確認する。カスタマイズで空白drag矩形選択、Shift追加、複数note移動、ghost / delta、undoを実操作する。
- カラーテーマをDark Pastel Studio、Vanilla Pastel、Friendly Signalへ切り替え、layoutが変わらず、色の柔らかさ／機能roleの見分けやすさ／長時間作業のしやすさを画面名と部品名で回答する。再読込後も選択が残ることを確認する。
- 以上はAI自律確認済みの★3。ユーザーがブラッシュアップ完了と明示するまで、機能別マトリクスのUI / 操作／音楽品質を★4へ上げない。
- `AI Starter`で新規作成し、土台がすぐ鳴るか、Chord / Bass / Drum / Pad / Arp / Synthを別々に編集できると理解できるか確認する。現在のlocal first sliceは生成AI接続ではなく、画面に表示される`Template Harmonizer` fallbackである。
- `音を組む`でVoice Deckの6 family（Chord / Synth / Pad / Lead / Arp / Bass）を切り替え、60 tonal音色をChord Padとして押す。Future Bass / Coreの前面へ出せる尖った音と補強層の音が十分に区別できるか確認する。
- 同じ`音を組む`のBass / Arp各10種、Drum 22種のpattern browserを試聴し、密度・跳躍・accent・groove / fillの違いが名前だけでなく耳で分かるか確認する。対象phraseを替えて適用し、コード差替え後もBass / Arpが追従し、Drumを含むMIDIが意図したグルーヴでStudio Oneへ入るかは実耳／実DAW gateとして確認する。
- 全14コードを同時表示するHarmonic Atlasで、基本のdegree順、彩り、意外の位置関係が分かるか、文字を読み込まなくても1 tapで試せるか確認する。
- 4 / 8 STEPで各コードを8分音符単位へ変え、1拍＋3拍のような進行を「音を組む」だけで作れるか確認する。
- `MIDI譜面を編集`で既存60分DAWへ進み、入口をまたいだ移動が自然か確認する。60分DAWは採用継続だが正式review前の★3であり、削除・完成扱いしない。
- start card、asset、chord pad、section、Canvas noteをhover / dragし、今つかんでいる対象、drop候補、move / resizeの区別が十分明確か確認する。
- 上記は★3のユーザー待ち。部品単位の指摘を反映し、ユーザーがブラッシュアップ完了と明示した後だけ★4へ進める。
- 更新されたDark Pastel画面で、青紫・藤・青緑の面が真黒より柔らかく感じるか確認する。yellow outlineを「押せる／変更できる」と認識でき、矩形tab、丸いP/H、pill音色、keycapコードの形が役割理解に役立つか、画面名と部品名で回答する。
- このUI確認は★3のユーザー待ち。ユーザーがブラッシュアップ完了と明示するまで★4へ進めない。
- 現在のProjectで鼻歌をMelodyへ適用した後、`追加レイヤーを生成`を再実行し、offline表示ではなくACE-Step layer追加まで完了するか確認する。
- 生成音を聴き、Future Bass / Coreらしさ、鼻歌melodyの残り方、追加layerを重ねたときの使いやすさを回答する。
- この確認が終わるまでACE-Step UI / 操作のmatrix scoreは★3。ユーザーのブラッシュアップ完了後だけ★4へ進める。
