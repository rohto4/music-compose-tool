# Phase 1 完了監査（2026-07-22）

この監査は、ユーザーが明示した「現在のUIでできる操作を一連の操作として動かす」という完成線に対して、local実装とprimary proofの有無を確認したものです。外部アカウント・実機・ライセンス確認が必要な項目は、実装済みでも別gateとして切り分けます。

## 判定

- local implementation score: **100 / 100**
- Goal: active（外部gateが残るため、live完成とは表現しない）
- Primary proof: `npm.cmd run check`、Vitest 20 files / 79 tests、Playwright Chromium FHD 10/10、`npm.cmd run test:pwa`、`npm.cmd run test:dark`
- VRAM policy: ACE-Step DiT-only実測 peak reserved 7,500 MiB、hard cap 10,240 MiB。14 GiBの1.7B LM経路は起動禁止。

## 利用者目線のざっくり進捗

0%を「モックだけ」、100%を「実際に希望するFuture Bass / Future Coreを作り、音質・操作感をブラッシュアップし、持ち出しまで完了」とした目安は**約76%**です。AI Starter、31音色Chord Voice Deck、全14コードHarmonic Atlas、可変拍進行、3入口MIDI合流は揃った一方、role追従patternとユーザーの実耳・実操作ブラッシュアップが残るため、local自動proof 100%をProduct完成度とは扱いません。

- いま動く: AI Starterの編集可能な6-role土台、31音色で即時発音するChord Pad、全14コードHarmonic Atlas、1〜4拍の4 / 8 STEP進行、41音色、pattern部分上書き、3入口から共通MIDI / 60分DAWへの合流、Web Audio試聴・Project再生、展開交換、鼻歌録音 / Basic Pitch音符化、manual save / `.mctproj`、WAV / STEMS / MIDI出力、fake MIDI / fake Misskey検証。
- まだ完成品質ではない: 実際の利用者によるUI・音楽結果のブラッシュアップ、ACE-Step長尺 / genre fit / humming追従の主観評価、実MIDI機器、実Misskey / X OAuth、PWAインストール、Studio One音源の個別EULA確認。
- 現在起動しているlocal gatewayはsymbolic fallbackとACE-Step DiT-only full-trackを公開する。追加layer生成時だけmodelをloadし、完了後unloadする。gateway停止時は空502を`gateway-unavailable`へ正規化し、編集可能伴奏を保持したまま再起動・再試行を案内する。

## 要件照合

| 要件 | local判定 | 根拠 / 境界 |
| --- | --- | --- |
| 複数Project作成・再読込 | verified | Project Home、IndexedDB manual save、reload E2E |
| AI Starter / 3入口 | verified | AI Starter、Pattern Board、experimental Hummingを提示し、同じProject / NoteEvent / MIDI / 60分DAWへ合流。local fallbackを明示 |
| 役割別内蔵音色 | verified | 41 assets。31 tonal presetは固有multi-layer profile、重複fingerprint 0。Future Bass / Core fitはuser review |
| Chord Voice Deck | verified | 9から31 tonal音色へ3.4倍化。Chord / Synth / Pad / Lead / Arp / Bassの6 familyと現在音色を同じ画面へ表示し、選択音色で即時発音 |
| Harmonic Atlas / 可変拍進行 | verified | 基本7・彩り4・意外3の全14候補を同時表示。4 / 8 STEPの各1〜4拍を累積tick、loop、Web Audio、MIDIへ反映 |
| Pattern部分編集 / note展開 | verified | pad被覆barだけgenerated chordを置換し、未編集barを保持。blockをmanual NoteEventへ原子的に展開 |
| Hover / drag feedback | verified | card / pad / slot lift、section grabbed / drop target、Canvas note hover / resize status、reduced motion。親切さはuser review |
| 10分ラフ / 30分整形 / 60分仕上げ | verified | 10分は展開固定、30分から展開編集、60分はTrack / Main-Sub Laneを選ぶDAW editorへ段階化 |
| 作成後の長さ・雰囲気・キー・BPM変更 | verified | 曲の設計tabのcontrolsが`project/settings` / `project/intent`へ接続し、arrangement長・再生・AI条件へ反映 |
| 音のピースを1 tap試聴・配置 | verified | Web Audio phrase auditionとblock placement E2E |
| 内蔵シンセ・生成ドラム・FX | verified | deterministic Web Audio音源、DAWの音色交換、FX plan。外部素材の再配布はしない |
| WAV / MP3 user asset | verified | magic bytes、decode、size/duration検査、private IndexedDB、project bundle同梱 |
| Studio One専用音源 | external | 専用Sound Setを直接読まず、ユーザーが権利を持つWAV/MP3 exportのみ |
| 鼻歌30秒録音・retake・比較 | verified | getUserMedia / MediaRecorder、take比較、明示停止、permission failure。機器が2chを返してもdecoded channelを平均してPCM16 monoへ正規化 |
| 鼻歌をpitch / rhythmへ音符化 | verified | bundled Basic Pitch dynamic import、PPQ 480、stereo fixture→mono `AudioBuffer`→real model E2E。物理mic再試聴はuser gate |
| 鼻歌を極力維持した伴奏 | verified | melody lock、chord/bass/drum/pad/arp/synth editable tracks、intent variant |
| ACE-Step追加レイヤー | verified | 鼻歌takeをWAV化し、参考音声も添えてACE-Step `complete` taskへ条件付け。gateway経由5.12秒artifact、最新peak 9,624MiBをadditional audio layerとして適用。flat音声を正本にしない |
| DAW操作 | verified | Canvas全曲piano roll、Track / Main-Sub Lane selector、double-click add、pitch/timing/length drag、選択音符インスペクタ（pitch / tick / length / velocity）、複数選択、copy/paste、quantize、realtime range-loop、audio clip位置／Gain／削除、mixer、FX、automation |
| Undo / Redo・manual save・project file | verified | immutable command history、IndexedDB保存、`.mctproj` import/export |
| WAV / stems / MIDI export | verified | master WAV、audio-only reference / user layerを含むtrack STEMS ZIP、Standard MIDIとheader/duration parser、browser download E2E |
| Web MIDI input | verified (fake) | note-on/off duration、velocity 0、handler cleanupをChromium fake deviceで確認。実機はexternal |
| 文章 / mood / voice memo / reference audio | verified | Humming Studioのintentとmedia kindを分離保存。voice memoはブラウザ録音→WAV正規化→spokenIntentAssetId、参考音声はupload、いずれも再生成へ反映 |
| Misskey / X share | verified (adapter) | Misskey `/api/notes/create`の明示post adapterをfake HTTP + Chromiumで確認。実instance tokenとX OAuthはexternal |
| PWA / responsive | verified (preview) | manifest、standalone、scope、service worker、shell cache、app自動登録、1440/768/375 viewport QA。install prompt実機はexternal。証跡: `docs/imp/evidence/pwa-runtime-qa-2026-07-22.json` |
| Dark Pastel surface / precision editor | verified | 青紫・藤・青緑の低彩度面、yellow操作grammar、役割別形状を全画面へ適用。60分Canvasは最暗面として保持。Full HD Harmonic Atlas下端887px、画面下端921px、375px overflow 0。dark QA 4面でconsole / network failure 0。証跡: `docs/imp/evidence/harmonic-atlas-dark-pastel-2026-07-22.json`、`docs/imp/evidence/dark-theme-qa-2026-07-22.json` |
| mobile precision DAW | intentionally out of scope | ユーザー回答どおり、スマートフォンは作成・編集・試聴・共有を優先し、精密piano-rollはWindows FHD/WQHD対象 |

## 残る外部gate

1. ユーザー所有Misskey instanceと短期tokenでtest noteを1件投稿する。
2. 実MIDI機器を接続し、browser permissionとnote-on/offを確認する。
3. Chrome install promptを実機で確認する。
4. X OAuth credentialを用意した場合のみdirect postを実行する。
5. Studio Oneのexact content / EULAを確認してから、必要なWAV exportだけを取り込む。

上記はlocal実装を停止させる阻害要因ではありません。秘密情報、外部resource作成、公開deployは行っていません。
