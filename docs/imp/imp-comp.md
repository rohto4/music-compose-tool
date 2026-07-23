# 完了記録

## 2026-07-24 HARMONY-001: 46 quality Harmonic Atlasの横断受入

- Major / Minorで各46件のcatalogを決定論的に生成し、基本7 degree、彩り、意外にPower 5、sus2 / sus4、aug、dim / dim7 / half-diminished、6th、7th、add9 / 9th / 11th / 13th、minor-major 7thを関連degreeの縦方向へ配置する。`コードを鳴らす音色 · 60`と4小節の`音色割当`は別tab責務として区別する。
- qualityは名称だけでなくintervalを正本に持つ。D major / A minorの全92 catalog itemを1件ずつ単独blockへmaterializeし、配置NoteEventの声数とrootからの半音差がquality intervalと一致することを固定した。
- 代表的なV13はChord Pad試聴で6声の周波数比、Standard MIDI Type 1で6声のpitch差が同じ`[0, 4, 7, 10, 14, 21]`になる。中央音域へ収めるvoicingは絶対octaveを変えてよいが、構成音を変えない。
- 旧14 pad IDをMajor / Minorそれぞれ列挙し、46件へ拡張後も既存Project / progression asset IDが解決できることを回帰へ固定した。WQHD / 375pxの46 card、長いsymbol、1 tap発音・配置、MIDI journeyは既存Chromium 15 / 15で確認済み。
- 主語ファイル: [Chord catalog / materialize](G:\devwork\music-compose-tool\src\domain\music\chord-patterns.ts)、[domain受入test](G:\devwork\music-compose-tool\src\domain\music\chord-patterns.test.ts)、[audio plan test](G:\devwork\music-compose-tool\src\domain\audio\audio-plan.test.ts)、[MIDI export test](G:\devwork\music-compose-tool\src\application\audio\exports.test.ts)、[Harmonic Atlas WQHD証跡](G:\devwork\music-compose-tool\docs\imp\evidence\harmonic-atlas-wqhd-dark-2026-07-23.png)。
- Proof: 対象4 files / 40 tests pass。全project checkは33 files / 150 tests、lint warning 0、typecheck、gateway smoke、build、progress、matrixをpass。コード選択の音楽的な分かりやすさと聴感は★3でユーザーレビュー待ち。

## 2026-07-24 FLOW-002: 曲の設計・展開・詳細編集の3段workflow

- 旧`ラフ制作 / カスタマイズ`の二重切替を、`01 曲の設計 / 02 展開を整える / 03 詳細の編集`へ一本化した。01は設計完了indicator、Mood 1 / 2、Key、Tempo、曲の流れ、02は共有INSERT TARGETと5つのINSERT SOURCE tab、03は既存Projectを共有するpiano-roll DAWを担当する。
- 02は選択PHRASEとコード譜を上部へ固定し、`コード・音色 / コードセット / 伴奏 / FX・Fill / 音色割当`だけを切り替える。4 / 8 STEPは8分音符の左右矢印で長さを変え、AUTOが残り拍を吸収する。source tabを切り替えても対象PHRASEを失わない。
- 伴奏は対象section、Mood、現在コード進行、コード音色を決定論的にscoreし、上位2件と一致理由を表示する。Melody、手編集音、他phraseを保護したまま、click / dragの同じProject commandで4小節へ適用する。
- 主語ファイル: [Workspace](G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx)、[Chord Pattern Board](G:\devwork\music-compose-tool\src\features\patterns\ChordPatternBoard.tsx)、[Project commands](G:\devwork\music-compose-tool\src\domain\music\project-commands.ts)、[styles](G:\devwork\music-compose-tool\src\styles.css)、[FLOW WQHD証跡](G:\devwork\music-compose-tool\docs\imp\evidence\flow-recommendations-wqhd-2026-07-24.png)。
- Proof: component / domain testとChromium journeyで3 tab、5 source tab、共有target、上位2推薦・理由、4 / 8 STEP矢印、click / drag、save / reload、WQHD / 375px横overflow 0を確認した。UI、操作感、音楽的fitは★3でユーザーレビュー待ち。

## 2026-07-24 DAW-012 / DAW-013: piano-roll firstとplayhead位置再生

- `03 詳細の編集`からMIDI接続状態、音符inspector、Sound Chunk棚、選択statusの常設面を外し、上部transport / tool、timeline、最初のviewportにpiano roll、track、下部Mixerへ整理した。任意の`?` guideはtransport、timeline、piano roll、track / mixerをspotlight表示し、Escapeで閉じる。
- ruler pointer / keyboard、縦playhead、先頭・section seek、停止位置保持を追加した。`AudioEngine.playProject(project, startTick)`は開始位置より前のeventをskipし、開始位置をまたぐNoteEvent / AudioClipを残り時間だけscheduleする。
- WQHD 2560×1440の最初のviewportでpiano rollが高さ320px以上見え、transport、timeline、track、Mixerが重ならないことを実画像確認した。375pxでは88鍵wheel scroll、表示外pitchへのnote追加、横overflow 0を確認した。
- 主語ファイル: [DAW editor](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[audio plan](G:\devwork\music-compose-tool\src\domain\audio\audio-plan.ts)、[Web Audio engine](G:\devwork\music-compose-tool\src\adapters\audio\web-audio-engine.ts)、[styles](G:\devwork\music-compose-tool\src\styles.css)、[WQHD証跡](G:\devwork\music-compose-tool\docs\imp\evidence\daw-first-viewport-wqhd-2026-07-24.png)。
- Proof: audio plan、DAW component、Chromium E2Eで途中note / clip、ruler、playhead、停止、先頭・section seek、88鍵、Mixerを確認した。Studio Oneの固有画面・iconは複製していない。実MIDI機器と実耳の操作感は外部／ユーザーgate。

## 2026-07-24 HOME-003 / START-002 / SHORTCUT-002: 開始前preview・3経路・設定表示

- Project Homeの保存Projectへ再生／停止、先頭、±30秒、任意位置range、現在時間／全長を追加した。別曲試聴時とunmount時は前のsourceを停止する。6曲starterも適用せず一時Projectとして試聴でき、選択中Projectや永続保存を暗黙変更しない。
- 新規曲は`パッチボードで組む`、`AIで土台を作る → 鼻歌でメロディを追加する`、`鼻歌をもとに曲を作る`の順序付き3経路とした。未選択時はfieldを隠し、選択後だけroute別fieldとsubmit labelを展開する。Project importは現時点で`.mctproj専用`と表示する。
- Shortcutはcanonical値と表示を分離し、`Ctrl + S`、`Shift + ↑`、未設定、conflict / browser予約errorを同じformatterへ統一した。入力待ちの同button再clickまたはEscapeでcaptureを中止し、localStorage schemaとcommand matchingを維持する。
- 主語ファイル: [Project Home](G:\devwork\music-compose-tool\src\features\projects\ProjectHome.tsx)、[App](G:\devwork\music-compose-tool\src\App.tsx)、[Shortcut registry](G:\devwork\music-compose-tool\src\application\shortcuts\shortcut-registry.ts)、[Shortcut modal](G:\devwork\music-compose-tool\src\features\settings\ShortcutSettingsModal.tsx)、[mobile route証跡](G:\devwork\music-compose-tool\docs\imp\evidence\project-home-route-mobile-2026-07-24.png)、[WQHD preview証跡](G:\devwork\music-compose-tool\docs\imp\evidence\project-home-preview-wqhd-2026-07-24.png)、[mobile preview証跡](G:\devwork\music-compose-tool\docs\imp\evidence\project-home-preview-mobile-2026-07-24.png)。
- Proof: component / Chromiumで未選択field非表示、3経路、別曲、seek、±30秒、終了、starter preview、`.mctproj専用`、shortcut表示・中止を確認した。375pxの新規作成detailsと長いProject名による横overflowも0へ修正した。

## 2026-07-24 INTEROP-001 / browser回帰: Studio One境界と全画面proof

- Studio Oneとの現在の交換線を、アプリ内完全保存`.mctproj`、編集可能なStandard MIDI Type 1、確定音のmaster WAV / track stemsに分けた。native `.song`は第三者向け公開schemaを確認できないため推測parserを作らず、openな`.dawproject`は将来の段階的export / import候補として分離した。
- 一次資料からformat別に渡せるdata、欠落data、plugin / Sound Set / media / EULA境界、推奨Stage 0〜3、ZIP / XML import時のfail-closed要件を記録した。Studio One installation、commercial plug-in、third-party converter、外部uploadは要求していない。
- 主語ファイル: [相互運用調査](G:\devwork\music-compose-tool\docs\research\studio-one-interoperability-2026-07-24.md)、[機能マトリクス](G:\devwork\music-compose-tool\docs\imp\phase1-feature-progress-matrix.html)、[browser journeys](G:\devwork\music-compose-tool\tests\e2e)、[dark QA](G:\devwork\music-compose-tool\scripts\qa_dark_theme.mjs)。
- Proof: `npm.cmd run check`はlint warning 0、typecheck、Vitest 33 files / 146 tests、gateway smoke、production build、進捗16 / 100、matrix 44 rows / 102 local linksをpass。`http://127.0.0.1:4173/`でChromium FHD 15 / 15 journeyを単一runでpass（5.2分）。WQHD 2560×1440と375×812を含むjourneyでconsole error、page error、request failure 0。`npm.cmd run test:dark`は1440 / 768 / 375 / editor、`npm.cmd run test:pwa`はmanifest / service worker / controller / cache / registrationをpassした。
- Accessibility proofはsemantic role、accessible name、unnamed button 0、keyboard操作の回帰であり、axe等による完全なWCAG監査の代替ではない。実Studio One import、実MIDI、PWA install prompt、実SNS、実耳音質は引き続き外部／ユーザーgate。

## 2026-07-23 PRJ-003: 新規Project名の自動採番

- 新規作成panelを開くたび、保存済みProject数から`新しい曲 1`、`新しい曲 2`…を編集可能な既定名として設定する。任意名への上書き、既存Project名、manual save境界は変更していない。
- 主語ファイル: [App](G:\devwork\music-compose-tool\src\App.tsx)、[Project Home component test](G:\devwork\music-compose-tool\src\App.test.tsx)、[Product要件](G:\devwork\music-compose-tool\docs\spec\product-requirements.md)、[ユーザー判断](G:\devwork\music-compose-tool\docs\imp\user-judge.md)。
- Proof: 対象component test 6 / 6 pass。`npm.cmd run check`はlint warning 0、typecheck、31 files / 133 tests、gateway smoke、production build、進捗16 units / weight 100、機能matrix 44 rows / 100 local linksをpass。

## 2026-07-23 INSERT-001 / FX-002: 共通挿入・section並べ替え・FX / Drum増強

- `音を組む`の初期順をコード譜／4小節挿入先、Harmonic Atlas、挿入棚へ固定しつつ、8つの主要sectionを専用handleのdrag、keyboard上下buttonで並べ替えられるようにした。順序は`patchtone.pattern-board.section-order.v1`として端末`localStorage`へ保存し、Project音楽dataへ混ぜず、`初期配置`で指定順へ戻す。mobileの固定挿入先よりsection handleの重なり順を下げ、操作対象を塞がない。
- Chord、進行template、Phrase Kit、role pattern、内蔵asset、user audio、Sound Chunkを`application/x-patchtone-insert-v1`へ統一した。互換するphrase / stepだけをdrop targetとして示し、click / tap fallbackとdragを同じProject commandへ接続した。挿入可能cardは小角丸、淡いcategory面、左accent、grab、hover liftへ統一し、Audio Paletteの選択tabとcard面を同じcategory色へ連動した。
- 内蔵音を136 profileへ拡張した。60 tonal、Drum 20、Percussion 8、FX 24、Transition 24を持つ。Drum kitはwaveform / brightness / character、kick / clap / hat / tomのduration・gain・panを分け、全20件のaudition fingerprintを別にした。FX / Transitionはriser / fall、reverse、impact、stutter、shatter、short whoosh、long wash等で方向、長さ、noise帯域、pan、終端layerを変えた。
- Sound Chunkを24種類へ増やし、`シュワーーー→ドン`、snare / tom / hat fill、reverse cymbal→crash、sub drop、glitch stutter、filter climb impact、downsweep等を通常NoteEventとして4小節へ挿入できる。Bass / Arp各10種にDrum 22種を加え、role patternは合計42種となった。
- Ableton / Native Instruments / iZotopeの公式制作資料から、backbeat、half-time、4小節末variation、snare加速、white-noise riser、reverse cymbal、impact / fall / stutter taxonomyを整理した。第三者WAV / MIDI / sampleは取得・同梱せず、一般的技法を本PJ独自の合成eventとsymbolic recipeへ変換した。
- 主語ファイル: [Chord Pattern Board](G:\devwork\music-compose-tool\src\features\patterns\ChordPatternBoard.tsx)、[insert payload](G:\devwork\music-compose-tool\src\features\patterns\insert-drag.ts)、[sound chunks](G:\devwork\music-compose-tool\src\domain\music\sound-chunks.ts)、[role patterns](G:\devwork\music-compose-tool\src\domain\music\role-patterns.ts)、[built-in assets](G:\devwork\music-compose-tool\src\domain\audio\built-in-assets.ts)、[audio plan](G:\devwork\music-compose-tool\src\domain\audio\audio-plan.ts)、[styles](G:\devwork\music-compose-tool\src\styles.css)、[research](G:\devwork\music-compose-tool\docs\research\fx-transition-drum-pattern-expansion-2026-07-23.md)。
- Proof: `npm.cmd run check`は31 files / 132 tests、lint warning 0、typecheck、gateway smoke、production build、matrix 44 rows / 100 local linksをpass。Chromium全15 journeyを単一runでpass（3.1分）し、section上移動・保存復元・初期化、全挿入cardのdrag、24 FX、42 pattern、WQHD / 375px overflow、WAV / STEMS / MIDIを確認した。`npm.cmd run test:dark`は1440 / 768 / 375とDAWでconsole / request failure 0、`npm.cmd run test:pwa`はcontroller / shell cache / app auto registrationをpass。証跡は[section reorder WQHD](G:\devwork\music-compose-tool\docs\imp\evidence\pattern-section-reordered-wqhd-dark-2026-07-23.png)、[compound FX WQHD](G:\devwork\music-compose-tool\docs\imp\evidence\insertable-compound-fx-wqhd-dark-2026-07-23.png)、[FX palette WQHD](G:\devwork\music-compose-tool\docs\imp\evidence\audio-palette-fx-wqhd-dark-2026-07-23.png)、[role pattern mobile](G:\devwork\music-compose-tool\docs\imp\evidence\role-pattern-browser-mobile-2026-07-23.png)。UI / 操作感 / 聴感は★3でユーザーレビュー待ち。

## 2026-07-23 PHRASE-001 / STARTER-002 / CHUNK-001: 伴奏フレーズ・多層starter・Sound Chunk

- `Cloud Intro / Candy Verse / Soda Build / Prism Drop / Bubble Break / Hyper Finale`の6種類を、コード進行、HOLD / PULSE / SYNC、Bass / Arp / Drum、Pad / Synth、音色のversion付き4小節recipeとして追加した。任意PHRASEへ1 commandで適用し、Melody、手編集NoteEvent、対象外phraseを保護する。9コード進行にもgenre / section / emotion tagを付けた。
- license確認済み6曲starterをMelody / Chordsだけの最小編成から、Bass / Drums / Pad / Arp / Synthを含む16小節・7 roleのDTM arrangementへ拡張した。曲ごと・4小節ごとにkit sequenceを変え、原曲由来の旋律・和声・出典は保持した。
- `シャラララン Harp`、Music Box、Pizzicato、Star Chime、Prism Riser、Candy Impactの6 Sound Chunkを追加した。相対tickの複数NoteEvent＋音色を1 commandで任意小節へ挿入でき、選択音から作ったuser chunkはversion付きMusicBlockとしてProject内へ保存・再挿入できる。試聴は一時Projectへchunk全音を展開して行う。
- 保存chunkはProject schemaの`assetId` 160文字上限を超えない短いheader block＋音ごとのblockへ分解した。`.mctproj`を実際に生成・再読込し、recipeと全NoteEventが一致するround-trip testを追加した。
- 主語ファイル: [phrase kits](G:\devwork\music-compose-tool\src\domain\music\kawaii-phrase-kits.ts)、[starter catalog](G:\devwork\music-compose-tool\src\domain\music\song-starters.ts)、[sound chunks](G:\devwork\music-compose-tool\src\domain\music\sound-chunks.ts)、[Chord Pattern Board](G:\devwork\music-compose-tool\src\features\patterns\ChordPatternBoard.tsx)、[DAW editor](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[research](G:\devwork\music-compose-tool\docs\research\kawaii-future-bass-phrase-kit-logic-2026-07-23.md)。
- Proof: `npm.cmd run check`は30 files / 124 tests、lint warning 0、typecheck、gateway smoke、production build、matrix 43 rows / 96 linksをpass。Chromium全14 journeyを実行し、100音／60 tonal／30 patternへの旧期待値4件を同期後、対象4ファイルを再実行して全pass。2560×1440と375×812も横overflow 0、console / request error 0。音楽的なfitは★3でユーザー実耳review待ち。

## 2026-07-23 AUDIO-005 / AUDIO-006 / DAW-010: 全曲・ブロック再生と発音境界修正

- `曲全体を再生`をloop 4重反復から曲尺のone-shotへ直し、選択note blockだけを現在track音色・相対timingで試聴する経路を追加した。
- toneのADSR、drum / noise、user audio clipへ連続envelopeと短いfadeを共通適用し、live Web Audioとoffline WAVの節目click / popを抑えた。
- Bass / Arp / Drum pattern試聴に混入していた「謎の口笛」は、4 / 8小節末へ無条件追加されていた共通`fx-sparkle` eventが原因だった。FX trackが有効な全曲planだけへ限定し、role auditionでは全30 patternともsparkle 0、曲尺外event 0をunitで固定した。
- 主語ファイル: [audio plan](G:\devwork\music-compose-tool\src\domain\audio\audio-plan.ts)、[gain envelope](G:\devwork\music-compose-tool\src\domain\audio\gain-envelope.ts)、[Web Audio engine](G:\devwork\music-compose-tool\src\adapters\audio\web-audio-engine.ts)、[DAW editor](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[audio tests](G:\devwork\music-compose-tool\src\domain\audio\audio-plan.test.ts)。

## 2026-07-23 SET-001 / DAW-011 / PATTERN-005 / ASSET-003: 操作設定・30 pattern・100音色

- テーマ選択の左へ`設定`を追加し、30操作のshortcut registry、大型modal、key capture、競合／browser予約拒否、解除、初期化、localStorage復元、focus trapを実装した。Ctrl+S / Z / Y、Ctrl+click複数選択、Shift+drag 1 octave、Alt+drag 1小節を通常Project commandへ接続した。
- HOLD / PULSE / SYNCの効果説明を表示し、Bass / Arp / Drumを各10種・全30 patternへ拡張した。発音位置、長さ、octave、accentのfingerprintは全件異なり、WQHDはrole内2列、mobileは1列にした。
- 内蔵音を100 profile・60 tonalへ拡張し、Harp、Pizzicato、Music Box / Celesta、Chorusを役割別に追加した。外部WAV / SoundFontは使わず、固有layer、detune、filter、ADSR、stereoで差を作った。
- 主語ファイル: [shortcut registry](G:\devwork\music-compose-tool\src\application\shortcuts\shortcut-registry.ts)、[settings modal](G:\devwork\music-compose-tool\src\features\settings\ShortcutSettingsModal.tsx)、[role patterns](G:\devwork\music-compose-tool\src\domain\music\role-patterns.ts)、[built-in assets](G:\devwork\music-compose-tool\src\domain\audio\built-in-assets.ts)、[WQHD evidence](G:\devwork\music-compose-tool\docs\imp\evidence\autonomous-quality-wqhd-2026-07-23.png)。

## 2026-07-23 DAW-009: compact操作statusと88鍵wheel scroll

- `0音をコピーしました`等を表示していた全幅green bandをDAWから撤去した。選択0件のCtrl+Cは何もコピーせずstatusも出さない。実際に選択・移動・複製した結果は、`MIDI譜面を編集`横のcompactな`role=status`へ移し、制作面の1行を回収した。
- pitch範囲をC3〜C6固定から標準ピアノのA0（MIDI 21）〜C8（MIDI 108）へ拡張した。白鍵52、黒鍵36、C音8、合計88鍵とCanvasを18px rowで共有し、初期viewportは従来と同じC6〜C3付近へ設定した。
- 横timeline scrollを持つCanvasが縦wheelを吸収したため、共通pitch viewportへnon-passive wheel listenerを設けた。縦deltaだけを鍵盤＋Canvasの`scrollTop`へ変換し、横deltaは既存timeline用に残した。実Chromiumで900px wheel後に初期画面外のB0をdouble-click配置し、inspector pitch、Canvas、NoteEventの一致を確認した。
- 主語ファイル: [DAW editor](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[styles](G:\devwork\music-compose-tool\src\styles.css)、[component tests](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.test.tsx)、[visual E2E](G:\devwork\music-compose-tool\tests\e2e\visual-quality.spec.ts)、[low-pitch evidence](G:\devwork\music-compose-tool\docs\imp\evidence\customize-piano-roll-wheel-low-1648-dark-2026-07-23.png)、[WQHD evidence](G:\devwork\music-compose-tool\docs\imp\evidence\customize-daw-wqhd-friendly-2026-07-23.png)。
- Proof: `npm.cmd run check`は25 files / 108 tests、lint warning 0、typecheck、gateway smoke、build、matrix 40 rows / 89 linksをpass。Chromium全13 journeyを単一runでpass（2.9分）。3テーマWQHD、1648px、375pxはconsole / request error 0、document横overflow 0。UI最終判断は★3でユーザーレビュー待ち。

## 2026-07-23 DAW-008: 白鍵・黒鍵を区別する縦型ピアノ鍵盤

- カスタマイズDAW左端の同幅音名列を、白鍵は全幅、黒鍵はピアノロール側へ寄せた72%幅として読める縦型鍵盤へ置き換えた。C3〜C6の37半音、白鍵22、黒鍵15、C音4を保持し、C音にはyellowのオクターブ境界markを付けた。
- `ROW_HEIGHT`の18pxをCSS custom propertyへ渡し、鍵盤37行とCanvasのpitch gridを同じ666pxへ固定した。pitch座標、NoteEvent、MIDI、選択／drag操作は変更していない。鍵盤は目盛りのため`aria-hidden`を維持し、演奏buttonとは表現しない。
- 3テーマで中立なpiano black / whiteを共通使用し、白鍵は濃い文字、黒鍵は白い文字とした。WQHDのDark / Vanilla / Friendly、1648×944、375×812を実画像確認し、上下誤差1px以内、375px document横overflow 0だった。
- 主語ファイル: [DAW editor](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[styles](G:\devwork\music-compose-tool\src\styles.css)、[component tests](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.test.tsx)、[visual E2E](G:\devwork\music-compose-tool\tests\e2e\visual-quality.spec.ts)、[Dark evidence](G:\devwork\music-compose-tool\docs\imp\evidence\customize-piano-roll-wqhd-dark-2026-07-23.png)、[Vanilla evidence](G:\devwork\music-compose-tool\docs\imp\evidence\customize-piano-roll-wqhd-vanilla-2026-07-23.png)、[mobile evidence](G:\devwork\music-compose-tool\docs\imp\evidence\customize-piano-roll-375-dark-2026-07-23.png)。
- Proof: `npm.cmd run check`は25 files / 107 tests、lint warning 0、typecheck、gateway smoke、buildをpass。Chromium visual QAとDAW主要編集journeyをpass。UI最終判断は★3でユーザーレビュー待ち。

## 2026-07-23 DAW-007 / DES-006: responsive Customizeとtitleless-ready workspace

- カスタマイズ上部へコード・伴奏込みの全曲再生／停止、明示track switch、補色の複数note選択、現在小節を読むviewport rail、Mixer内の音色単体試聴を追加した。FXは`Sparkle Dust`、Transitionは`Soft Rise`等の実assetを直接試聴し、誤ったtonal instrument selectを表示しない。FX / AI Layerと1音Inspectorは既存機能を捨てず圧縮した。
- 1648×944でMixer全cardの内部overflow 0、document横overflow 0を計測した。FX / Transitionのcompact card、7列＋5列の折返し、Mix / Automation、Promptまで隣cardへ侵入しない。選択noteはtrack色の濃淡だけでなくyellow fill＋cyan outlineで判別する。
- 見出しを情報構造の足場として扱い、同義反復、英字eyebrow、固定subtitleを削減した。曲条件／展開候補、6曲starter、Creative Briefは、現在値・曲名・置換button・用途別出力buttonだけで意味が通る状態にして表示titleを外した。`aria-label`、status、置換範囲、license、Instrumental制約は保持した。
- 主語ファイル: [DAW editor](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[Workspace](G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx)、[Creative Brief UI](G:\devwork\music-compose-tool\src\features\projects\CreativeBriefPanel.tsx)、[styles](G:\devwork\music-compose-tool\src\styles.css)、[1648 evidence](G:\devwork\music-compose-tool\docs\imp\evidence\customize-daw-1648-friendly-2026-07-23.png)、[titleless WQHD](G:\devwork\music-compose-tool\docs\imp\evidence\song-design-wqhd-vanilla-2026-07-23.png)。
- Proof: DAW transport / audition / track switch component test、1648px refinement E2E、WQHD～375px 3-theme visual QA、dark QA、PWA QAをpass。最新copy更新後も`npm.cmd run check`（25 files / 106 tests、lint warning 0）とChromium全12 journeyの単一run（2.9分）をpass。UI / 操作の完成判断は★3でユーザーレビュー待ち。

## 2026-07-23 CHORD-008 / FLOW-001 / ARR-010: 進行template・曲条件連動・左→右section rail

- 9つの定番コード進行を響き・感情・使いどころで比較し、選択中の任意4小節phraseへ1 tapで適用する。曲全体keyはmajor / minor 24候補から変更でき、Chord、コード追従Bass / Arp、再生、MIDI、Briefを同期し、手入力／鼻歌Melodyは黙って移調しない。
- 目標時間、BPM、key、moodを、現在推定尺、展開候補、コード記号、再生へ連動した。設計値と現在尺の差を小節数で示し、展開templateは明示buttonで置換する。`音を組む`にも同じArrangementのcompact railを置き、Build延長、Bridge追加、並べ替えへ戻らず到達できる。
- sectionは左から右へ接続・連番表示し、末尾の空slotからIntro / Verse / Build / Drop / Break / Bridge / Outroを追加する。音配置はtrack行×section列のMain / Sub cellとし、音色選択と時間配置を分離した。Ableton Session ViewとLogic Live Loopsのtrack / scene二軸を一次資料として参照し、UIの複製ではなく初心者向けの読み順へ変換した。
- 主語ファイル: [Chord templates](G:\devwork\music-compose-tool\src\domain\music\chord-progression-templates.ts)、[Chord Board](G:\devwork\music-compose-tool\src\features\patterns\ChordPatternBoard.tsx)、[Arrangement editor](G:\devwork\music-compose-tool\src\features\arrangement\ArrangementEditor.tsx)、[Arrangement templates](G:\devwork\music-compose-tool\src\features\arrangement\arrangement-templates.ts)、[Workspace](G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx)、[workflow research](G:\devwork\music-compose-tool\docs\research\composition-workflow-prompt-and-score-formats-2026-07-23.md)。
- Proof: 任意PHRASE 3への適用、A major変更、横断section追加、全曲再生をrefinement E2Eでpass。Fast Refresh向けにtemplate dataをcomponent fileから分離し、ESLint warning 0へした。音楽的な選びやすさは★3でユーザーレビュー待ち。

## 2026-07-23 ASSET-002 / STARTER-001: 88音bankと6つの編集可能な曲starter

- 内蔵音を88 profileへ拡張した。48 tonal、Drum / Percussion各8、FX / Transition各12を持ち、riser、downlifter、sweep、impact、burst、sparkle等をoscillator / noise、envelope、filter、stereo、direction、rhythmで分けた。試聴末尾の口笛状音は共通の高音終端motifが原因で、選択asset以外の締め音として除去しreleaseも有限化した。
- Mutopiaの個別piece pageでPublic Domain / CC BY 4.0を確認し、録音を同梱せずsymbolic dataだけを新規encodingした。Ah vous dirai-je、Ode to Joy、Canon in D、Bach Prelude in C、Eine kleine Nachtmusik、Beethoven Symphony No. 5の6 studyを、Melody / Chords / Arrangement / Key / BPMへ1 history unitで展開する。音色と手動Mixer設定は保持し、置換範囲とattributionを適用前に表示する。
- 6曲は16小節でも、反復主題、隣接音旋律、循環和声、分散和音、主題と応答、短短短長motifという異なる編集課題を持つ。件数だけの水増しはしていない。
- 主語ファイル: [sound bank](G:\devwork\music-compose-tool\src\domain\audio\built-in-assets.ts)、[audio plan](G:\devwork\music-compose-tool\src\domain\audio\audio-plan.ts)、[starter catalog](G:\devwork\music-compose-tool\src\domain\music\song-starters.ts)、[starter tests](G:\devwork\music-compose-tool\src\domain\music\song-starters.test.ts)、[license research](G:\devwork\music-compose-tool\docs\research\editable-song-starter-license-research-2026-07-23.md)。
- Proof: asset件数、profile fingerprint重複0、asset別timbreId、末尾高音なし、6 starterのsource / license / bounded 16 bars / atomic materializationをunitへ固定。WQHDでは6件を2段×3列、mobileは1列へ畳み、visual QAで横overflow 0。聴感と曲データの有用性は★3でユーザーレビュー待ち。

## 2026-07-23 PAT-007: Bass / Arp / Drum harmony-follow pattern browser

- `音を組む`へBass / Arp / Drum各5種、合計15のpattern browserを追加した。全候補を隠さず3 role列で表示し、対象4小節phrase、密度、用途、現在適用中、4小節試聴、1 tap適用を同じ面へ置いた。mobileは1列へ畳み、見出しと15候補を縦scrollで読む。
- version付きcatalogと決定論的generatorを追加した。Bassは各コードroot、Arpはchord tone、Drumは4小節tick境界へ追従する。phrase scoped commandは対象role Main laneの対象phraseだけを置換し、他phrase、Melody、Humming、user audio、user-edited noteを保護する。旧patternの編集noteが残っても旧pattern全体を再生成しない。
- 役割patternは通常NoteEventとしてundo / redo、save / reload、Web Audio、WAV / STEMS、Standard MIDIへ合流する。既存MIDI writerが`drums` laneを除外していた不具合も修正し、Drumをchannel 10へ出力する既存経路を有効化した。
- 主語ファイル: [role pattern catalog / generator](G:\devwork\music-compose-tool\src\domain\music\role-patterns.ts)、[phrase command](G:\devwork\music-compose-tool\src\domain\music\project-commands.ts)、[browser UI](G:\devwork\music-compose-tool\src\features\patterns\ChordPatternBoard.tsx)、[audio audition](G:\devwork\music-compose-tool\src\domain\audio\audio-plan.ts)、[MIDI writer](G:\devwork\music-compose-tool\src\application\audio\exports.ts)。
- Proof: 15個の演奏fingerprint、長いコードでのmotif反復、chord差替え追従、旧手編集pattern保護、phrase範囲、4小節audio plan、Bass / Arp / Drum MIDI trackをunit testへ固定。全回帰はVitest 23 files / 95 tests、Chromium 11/11、dark QA、PWA QA、matrix 32 rows / 77 local linksをpass。Chromiumで試聴、3 role適用、undo / redo、コード変更、保存／再読込、MIDI、375px overflow 0を確認した。証跡は[applied WQHD](G:\devwork\music-compose-tool\docs\imp\evidence\role-pattern-applied-wqhd-dark-2026-07-23.png)、[mobile](G:\devwork\music-compose-tool\docs\imp\evidence\role-pattern-browser-mobile-2026-07-23.png)、[responsive metrics](G:\devwork\music-compose-tool\docs\imp\evidence\theme-responsive-qa-2026-07-23.json)。音楽的fitは★3でユーザー実耳review待ち。

## 2026-07-23 PIVOT-001 / MOB-004: 無制限Chord Score・長押し演奏・portable Creative Brief

- 4小節phraseを上限なく追加できる譜面型progressionへ拡張した。各phraseは4 / 8 stepを8分音符単位でAUTO配分して16拍を保ち、desktopは2 phrase＝8小節／行、smartphoneは1 phrase＝4小節／段で縦に読む。初期4 phrase＝16小節、phrase追加／削除、小節番号、コード長、全曲loop、Web Audio、MIDI、save / reloadを同じtick列へ揃えた。
- Chord Padはpointerdownで現在の31 tonal音色による持続和音を開始し、pointerup / pointercancel / lostpointercaptureで停止する。tap配置は1回だけ、keyboardは有限auditionへfallbackする。375×812では全14コードを7列に収め、最小44px、Harmonic Atlasとdocumentの横overflow 0を確認した。
- Projectから人向けコード譜、ABC 2.1、全曲Creative Brief Markdown、versioned JSON、既存`.mctproj`をcopy / downloadするpanelを追加した。曲の設計、音の役割、展開、コードの各surfaceから担当Promptを出せる。すべて`Instrumental only / no vocals / no lyrics / no spoken words`を含み、主線はLead / Melody instrumentとして出力する。
- 主語ファイル: [Chord Score / Pad](G:\devwork\music-compose-tool\src\features\patterns\ChordPatternBoard.tsx)、[Creative Brief generator](G:\devwork\music-compose-tool\src\application\projects\creative-brief.ts)、[Creative Brief panel](G:\devwork\music-compose-tool\src\features\projects\CreativeBriefPanel.tsx)、[sustained Web Audio](G:\devwork\music-compose-tool\src\adapters\audio\web-audio-engine.ts)、[phrase command](G:\devwork\music-compose-tool\src\domain\music\project-commands.ts)、[research](G:\devwork\music-compose-tool\docs\research\composition-workflow-prompt-and-score-formats-2026-07-23.md)。
- Proof: Vitest 22 files / 88 tests。Chord sequenceは任意個の4小節phraseとpartial phrase拒否、Creative BriefはABC bar / durationとinstrumental制約を固定。Chromium pattern journeyは長押しrelease、＋4小節、ABC / MIDI、mobile順序／overflowをpass。画面証跡は[WQHD Dark](G:\devwork\music-compose-tool\docs\imp\evidence\chord-workbench-wqhd-dark-2026-07-23.png)、[mobile score](G:\devwork\music-compose-tool\docs\imp\evidence\chord-score-mobile-2026-07-23.png)、[responsive metrics](G:\devwork\music-compose-tool\docs\imp\evidence\theme-responsive-qa-2026-07-23.json)。UI / 操作 / 音楽品質は★3でユーザーレビュー待ち。

## 2026-07-23 DAW-006: ラフ／カスタマイズと複数note範囲編集

- 曖昧だった10 / 30 / 60分surfaceを、曲の設計・コード・音色・section・Promptを扱う`ラフ制作`と、既存Canvas DAWを保持した`カスタマイズ`の2 modeへ統合した。Intro / Verse / Build / Drop / Break / Bridge / Outro、3入口、Humming、Project contractは削除・分岐していない。
- DAWへ空白drag矩形marquee、Shift追加選択、選択note群のatomic pitch / timing移動、共有制約delta、drag ghost、tick / semitone表示、pointer cancel、undo / redoを追加した。既存single move / resize、inspector、snap、viewport cullingを維持する。
- 主語ファイル: [Workspace modes](G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx)、[DAW editor](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[multi-note command](G:\devwork\music-compose-tool\src\domain\music\project-commands.ts)、[workflow research](G:\devwork\music-compose-tool\docs\research\composition-workflow-prompt-and-score-formats-2026-07-23.md)。
- Proof: component testで2 noteを矩形選択し、両方を+480 tick / +1 semitoneへ1 history unitで移動。Chromium DAW journey、Full E2E 11/11、WQHD customize screenshotをpass。画面証跡は[Customize DAW](G:\devwork\music-compose-tool\docs\imp\evidence\customize-daw-wqhd-friendly-2026-07-23.png)。既存DAW UI / 操作は★3のままユーザー正式reviewを待つ。

## 2026-07-23 DES-005: 3 token themeとWQHD visual quality

- 現行layoutを変えず、青紫・藤・青緑の`Dark Pastel Studio`、vanilla baseの`Vanilla Pastel`、role識別を強めた`Friendly Signal`をcompact selectorで切り替えるようにした。theme IDは端末`localStorage`へ保存し、Project dataへ混ぜない。
- 2560×1440を主viewportに、1920×1080、1440×900、768×1024、375×812でHome、新規作成、曲の設計、Chord Score / Harmonic Atlas、section、Prompt、Customize DAWを観測した。2 mode化後に残ったworkspace tabの空4列目を3列へ修正した。
- 主語ファイル: [theme state](G:\devwork\music-compose-tool\src\App.tsx)、[tokens](G:\devwork\music-compose-tool\tokens.css)、[surface CSS](G:\devwork\music-compose-tool\src\styles.css)、[visual QA](G:\devwork\music-compose-tool\tests\e2e\visual-quality.spec.ts)、[dark QA](G:\devwork\music-compose-tool\scripts\qa_dark_theme.mjs)。
- Proof: 3 themeでChord Board geometry一致、4 phrase、14 chord、unnamed button 0、全breakpoint document overflow 0。dark QAは1440 / 768 / 375 Homeと1440 DAWでconsole / request failure 0。PWAはmanifest、service worker controller、shell cache、自動登録をpass。証跡は[Vanilla WQHD](G:\devwork\music-compose-tool\docs\imp\evidence\chord-workbench-wqhd-vanilla-2026-07-23.png)、[Friendly WQHD](G:\devwork\music-compose-tool\docs\imp\evidence\chord-workbench-wqhd-friendly-2026-07-23.png)、[Vanilla new project](G:\devwork\music-compose-tool\docs\imp\evidence\project-home-new-wqhd-vanilla-2026-07-23.png)、[dark QA JSON](G:\devwork\music-compose-tool\docs\imp\evidence\dark-theme-qa-2026-07-23.json)。色味の最終判断は★3でユーザーを待つ。

## 2026-07-22 PIVOT-001 unit: Harmonic Atlas・31音色Chord Voice Deck・Dark Pastel

- Chord Padの音色を専用9音色から、既存41音色中の31 tonal profileへ拡張した。Chord / Synth / Pad / Lead / Arp / Bassの6 family tabで絞りつつ、`LIVE VOICE · 31`、現在音色名、family、role tagを常時表示する。音源名だけを増やさず、既存の固有multi-layer synthesis profileをChord track `instrumentId`へそのまま保存し、pad押下で和音として即時発音する。
- `基本 / 彩り / 意外`を排他的tabから属性へ変更した。基本7 degreeを左から右の主軸、彩り4と意外3を関連degreeの上下へ置く`Harmonic Atlas`として全14候補を同時表示し、輪郭・位置・色で役割を補助判別する。全候補は1 tapで試聴と配置を行う。
- 4 / 8を小節ではなくprogression STEPとして扱い、各STEPを1〜4拍へ変更できるようにした。`pattern/chords-sequence` commandが配置block、累積start tick、loop終端を1 history unitで更新し、PULSE等のNoteEventをblock終端内へclampする。1拍＋3拍の開始位置とnote durationがStandard MIDIにも保持される。
- 全幅のPatchboard / Humming切替を左上の丸いP / Hへ縮小し、ring、status dot、`aria-current`でactive / inactiveを示す。全画面の設計原則を「主要選択肢を隠さない、状態を同じframeへ残す、形に意味を持たせる、compactでも小さくしすぎない、1 tapで音を返す、必要箇所だけ深掘りする」の6点に統一した。
- near-black一色をやめ、baseをblue-violet、panelをslate-lavender、selected / music surfaceをblue / plum / sage castへ分けるDark Pastel tokenへ更新した。60分DAW Canvasは詳細編集の最暗面として保持し、削除・置換・★4化していない。
- Full HDではworkspace見出し、Voice Deck、横並びの演奏shape、進行rail、3段Atlasを情報削除なしで圧縮した。1920×1080でChord Pad全体の下端921px、Harmonic Atlas下端887px、document horizontal overflow 0。375pxは内部scrollで幅を保持し、document overflow 0。
- 主語ファイル: [Chord Pad UI](G:\devwork\music-compose-tool\src\features\patterns\ChordPatternBoard.tsx)、[Chord / beat domain](G:\devwork\music-compose-tool\src\domain\music\chord-patterns.ts)、[Atomic progression command](G:\devwork\music-compose-tool\src\domain\music\project-commands.ts)、[31 tonal assets](G:\devwork\music-compose-tool\src\domain\audio\built-in-assets.ts)、[Surface switcher](G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx)、[Global UI](G:\devwork\music-compose-tool\src\styles.css)、[Dark Pastel tokens](G:\devwork\music-compose-tool\docs\design\prototypes\pastel-patchboard\tokens.css)、[feature matrix](G:\devwork\music-compose-tool\docs\imp\phase1-feature-progress-matrix.html)。
- Proof: ESLint / TypeScript pass、Vitest 20 files / 79 tests、Chromium FHD E2E 10/10（3分33秒、1 worker）、dark QA 4面、production PWA runtime QA、matrix 26 rows / 58 unique local linksをpassした。画面証跡は[desktop](G:\devwork\music-compose-tool\docs\imp\evidence\harmonic-atlas-desktop-2026-07-22.png)、[mobile](G:\devwork\music-compose-tool\docs\imp\evidence\harmonic-atlas-mobile-2026-07-22.png)、[layout metrics](G:\devwork\music-compose-tool\docs\imp\evidence\harmonic-atlas-dark-pastel-2026-07-22.json)。UI / 操作 / 音楽品質は★3のままユーザーレビューを待つ。

## 2026-07-22 PIVOT-001 unit: AI Starter・41音色・3入口MIDI合流・操作feedback

- 新規Projectの入口を`AI Starter`、手動`Pattern Board`、experimental `Humming Studio`の3つにした。AI StarterはTemplate Harmonizerを常設local fallbackとして、starter melodyとChord / Bass / Drum / Pad / Arp / Synthを編集可能なNoteEventへ生成し、実際に使ったengineをGeneration CandidateとUIへ表示する。flat audioだけを正本にしていない。
- Pattern Boardの部分編集をtick範囲の上書きへ修正した。1小節のchord padを置いた時は、その範囲のgenerated chordだけを置換し、残りのAI生成小節を保持する。常設の`MIDI譜面を編集`はpattern blockをmanual NoteEventへ原子的に展開し、元blockを削除して二重再生を避けたうえで既存60分DAWへ移動する。3入口すべてが同じProject / Track / Lane / NoteEvent / MIDI exportへ合流する。
- 内蔵音色を41個へ拡張した。内訳はChord 9、Bass 5、Lead 4、Synth 4、Pad 5、Arp 4、Drum / Percussion / FX / Transition 10。31 tonal presetはすべて固有の2〜7 oscillator layer、detune、octave、gain、pan、ADSR、filter envelope、resonance、role tagを持つ。名称だけの重複profileはtestで禁止し、Audio Paletteへカテゴリ件数filterを追加した。Chord Padでは9音色をその場で選び即時発音できる。
- surface card、pattern slot、chord pad、timbre、asset、arrangement sectionへhover / focus liftとoutline / shadowを追加した。section dragはgrabbedとdrop候補を別状態で示し、live statusで対象を読み上げる。Canvas piano rollはhover noteを浮かせ、move / resize中の音数と確定方法を表示する。`prefers-reduced-motion`ではtransformを止めてもoutline / shadow / labelを残す。
- 375pxのAI Starter→Chord track→60分DAWで既存note inspectorの横はみ出しを検出し、mobile末尾overrideとDAW内clip / internal scroll境界を修正した。document overflowは0。CPU負荷の高いOfflineAudioContext STEMS journey同士が2 workerで競合したため、Playwrightを1 workerへ固定して機能failureとresource contentionを分離した。
- 主語ファイル: [AI Starter domain](G:\devwork\music-compose-tool\src\domain\music\ai-starter.ts)、[Chord pattern convergence](G:\devwork\music-compose-tool\src\domain\music\chord-patterns.ts)、[Project commands](G:\devwork\music-compose-tool\src\domain\music\project-commands.ts)、[41 timbres](G:\devwork\music-compose-tool\src\domain\audio\built-in-assets.ts)、[Project Home](G:\devwork\music-compose-tool\src\features\projects\ProjectHome.tsx)、[Workspace convergence](G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx)、[Chord Pad UI](G:\devwork\music-compose-tool\src\features\patterns\ChordPatternBoard.tsx)、[interaction CSS](G:\devwork\music-compose-tool\src\styles.css)、[feature matrix](G:\devwork\music-compose-tool\docs\imp\phase1-feature-progress-matrix.html)、[evidence](G:\devwork\music-compose-tool\docs\imp\evidence\ai-starter-pattern-convergence-2026-07-22.json)。
- Proof: `npm.cmd run check` pass（ESLint / TypeScript、Vitest 20 files / 76 tests、gateway smoke、production build、Phase progress、feature matrix 25 rows / 52 links）。Chromium FHD E2Eは10/10 pass（3分31秒、1 worker）。AI Starter focused E2Eはdesktop screenshots、41音色、Chord 9 / Pad 5 filter、MIDI download、375px overflow / console / request failure 0を確認した。3入口化で変わったHome radio名へdark QA selectorを追従させ、1440 / 768 / 375px Homeと1440px editor、production PWAのmanifest / service worker / shell cache / app自動登録も再passした。UI / 操作 / 音楽品質は★3で止め、ユーザーのブラッシュアップ完了後だけ★4へ進める。

## 2026-07-22 DES-004: 黄色を操作専用色にしたinteraction grammar

- ユーザー実機確認で、pink / cyan / mint / orangeが一般button、selected、status、音楽roleへ同時に使われ、「どこを押すと何が起きるか直感的に分からない」と判定された。操作可能性の色と音楽データの色が競合していたことをroot causeとした。
- `Patchtone Night Grid`へsemantic tokenを追加し、yellow＝操作可能control、pastel＝note / track / assetの音楽データ、green＝成功・接続、red＝失敗・録音・削除、gray＝非操作・disabledへ固定した。primary actionはsolid yellow、secondary actionはyellow outline、tab / phaseはyellow marker、削除はred outlineとした。
- 一般panelのcyan / purple / orange面塗りをdark neutralへ戻した。surface選択、制作phase、workspace tab、再生、保存、試聴、配置、展開template、音のblock、Humming録音、DAW toolbar、mixer、FX / automationへ同じcontrol ruleを適用し、track role pastelは細い上辺・左辺とCanvas noteへ残した。
- 色だけに依存せず、矩形枠、動詞label、右側action配置、hover / pressed、yellow focus ring、disabled opacity、`aria-current` / `aria-pressed`を併用した。interaction color契約をProject正本とdesign directionへ反映し、dark-theme QAへprimary yellow / secondary yellow outlineのcomputed-style assertionを追加した。
- 主語ファイル: [tokens.css](G:\devwork\music-compose-tool\docs\design\prototypes\pastel-patchboard\tokens.css)、[styles.css](G:\devwork\music-compose-tool\src\styles.css)、[DawMelodyEditor.tsx](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[design-directions.md](G:\devwork\music-compose-tool\docs\design\design-directions.md)、[PROJECT.md](G:\devwork\music-compose-tool\PROJECT.md)、[qa_dark_theme.mjs](G:\devwork\music-compose-tool\scripts\qa_dark_theme.mjs)、[dark QA evidence](G:\devwork\music-compose-tool\docs\imp\evidence\dark-theme-qa-2026-07-22.json)。
- Proof: `npm.cmd run check`（ESLint / TypeScript、Vitest 15 files / 62 tests、gateway smoke、build、progress / matrix）pass、Chromium FHD E2E 8/8 pass、dark-theme QAは1440 / 768 / 375px home＋1440px editorでoverflow / console error / request failure 0。UI / 操作はAI自律確認上限の★3で止め、ユーザーのブラッシュアップ判断を待つ。

## 2026-07-22 AI-011: 追加レイヤーのgateway offline recovery

- 実ブラウザで「追加レイヤーを適用できませんでした: Home AI gateway returned malformed JSON.」を確認した。`127.0.0.1:4173`のViteだけがlistenし、`127.0.0.1:17321`のgatewayは停止していた。Vite proxyは空の`502 text/plain`を返し、browser clientが非JSON本文をmodel応答破損と誤分類したことがroot cause。
- Vite proxy errorを`503 application/json`の`gateway-unavailable`へ正規化し、client側もnetwork refusalと5xx非JSONを同codeへ防御的に変換する。2xxの非JSONは引き続き`malformed-response`として区別する。
- 追加layer UIはgateway停止を「Home AIがオフライン」と表示し、編集可能な6伴奏trackを保持したまま再起動・再試行を案内する。gatewayがTemplate / Rule fallbackだけを返しaudio artifactが無い場合も`ace-step-unavailable`として区別する。
- 検証済み`C:\LLM`配置または`HOME_AI_ACE_*` overrideをfile typeまで検査し、ACE-Step DiT-onlyだけを有効にする`npm.cmd run gateway:ace` launcherを追加した。source / reference条件付き実測の保守値9,624MiB / hard cap 10,240MiBをhealthへ反映し、1.7B LMは起動しない。
- 実runtimeはPID 59016が`127.0.0.1:17321`をlistenし、direct / Vite proxy healthともHTTP 200、full-track backend `ace-step-1.5-dit-only`、model `unloaded`、queue 0を確認した。待機時GPU使用量は約2.4GiB。
- 主語ファイル: [home-ai-gateway.ts](G:\devwork\music-compose-tool\src\adapters\ai\home-ai-gateway.ts)、[AccompanimentPanel.tsx](G:\devwork\music-compose-tool\src\features\humming\AccompanimentPanel.tsx)、[vite.config.ts](G:\devwork\music-compose-tool\vite.config.ts)、[start_ace_gateway.mjs](G:\devwork\music-compose-tool\scripts\start_ace_gateway.mjs)、[phase1-completion.spec.ts](G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts)、[offline recovery evidence](G:\devwork\music-compose-tool\docs\imp\evidence\home-ai-gateway-offline-recovery-2026-07-22.json)。
- Proof: client focused test 8/8、offline Playwright 1/1、`npm.cmd run check`（Vitest 15 files / 62 tests、gateway smoke、build、progress / matrix）、full Chromium FHD E2E 8/8、final ESLint warning 0。ユーザーの同一melodyでの再生成・試聴は★4判断gateとして残す。

## 2026-07-22 MIC-010: stereo microphone inputのmono自動正規化

- 実機でBasic Pitchが「入力オーディオバッファはモノラルではありません。チャンネル数は2です。1であるべきです。」と失敗した。`getUserMedia({ channelCount: 1 })`は希望制約であり、microphone / browserが2chを返す場合がある一方、従来はdecode後のstereo `AudioBuffer`をBasic Pitchへそのまま渡していたことが原因だった。
- decoded audioの全channelをframe単位で平均し、明示的な`ArrayBuffer` backingを持つ1ch `Float32Array`へdownmixする境界を追加した。`audioBlobToWav`はmicrophone、imported humming、voice memo、ACE source / referenceを常にPCM16 mono WAVへ正規化し、Basic Pitchの`transcribe`も上流を迂回したstereo inputを解析直前に再度mono化する。
- stereo channel averageとPCM WAV header（channel count 1 / block align 2）のunit testを追加した。Chromium E2Eは2ch humming fileを同梱Basic Pitchで音符化し、2ch鼻歌・2ch参考音声がlocal AI gatewayへ1ch source / referenceとして届くことを確認する。
- 主語ファイル: [basic-pitch-transcriber.ts](G:\devwork\music-compose-tool\src\adapters\humming\basic-pitch-transcriber.ts)、[basic-pitch-transcriber.test.ts](G:\devwork\music-compose-tool\src\adapters\humming\basic-pitch-transcriber.test.ts)、[foundation.spec.ts](G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts)、[phase1-completion.spec.ts](G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts)、[stereo-mono-input-regression-2026-07-22.json](G:\devwork\music-compose-tool\docs\imp\evidence\stereo-mono-input-regression-2026-07-22.json)。
- Proof: 対象AI layer E2E 1/1、`npm.cmd run check`（Vitest 15 files / 60 tests、gateway smoke、production build、progress / matrix validation）、`npm.cmd run test:e2e`（Chromium FHD 7/7）をpassした。物理microphone固有のcontainer / driver経路はユーザー再試聴を★4判断gateとして残す。

## 2026-07-22 P1-AI: source / reference条件付きACE-Step runtime再実測

- local gatewayからACE-Step 1.5 DiT-onlyの`complete` taskを実行し、鼻歌source、参考音声、melody notesを同時に条件付けしたjob `job-7e7db300-d119-4422-ad18-69a6f2b1c165`を`succeeded`まで確認した。symbolic melodyはProjectの編集可能な正本として保持する。
- 10秒requestに対するartifactは5.12秒、48kHz stereo、HTTP 200、1,966,168 bytes、SHA-256 `87768fafafb5d21edfbb5b62794896ae12fc9e6e9045d2c380b3070e241c1f6e`。DiT初期化4.614秒、生成1.542秒、total 6.159秒だった。
- peak reservedは9,624MiBで10,240MiB hard cap内。source / reference一時file削除とjob後model unloadを確認した。14,128MiBを記録した1.7B LM profileは引き続き起動禁止で、再実行していない。
- 証跡: [ace-step-gateway-runtime-2026-07-22.json](G:\devwork\music-compose-tool\docs\imp\evidence\ace-step-gateway-runtime-2026-07-22.json)。短尺runtime proofであり、Future Bass / Coreの主観fit、長尺、最終的な鼻歌追従品質はユーザー試聴gateとして残す。

## 2026-07-22 APP-004: 星取り表の段階定義と関連ファイル一覧

- ユーザー指定に合わせ、機能マトリクスのレビュー段階を再定義した。★3はAIが自律的に確認できた上限、★4はユーザーのブラッシュアップ完了、★5は最後のAI調整完了とする。UI / 操作はAI確認後も★3で止め、★3を黄色、★2以下を赤、★4をcyan、★5をmintで表示する。
- 既存の★5初期値をそのまま採用せず、matrixのdefault scoreを全列で3以下へcapした。ユーザー確認後だけ`localStorage`のレビュー上書きで4/5へ進められる。古い評価は`patchtone-phase1-feature-matrix-v2`へversion upして混入を避けた。
- 各セルの単一リンクを「関連ファイル一覧」に変更し、主な実装境界に加えてUI / Project context / 完成監査 / 実行定義 / Active tasksの参照先を一覧表示する。
- 主語ファイル: [phase1-feature-progress-matrix.html](G:\devwork\music-compose-tool\docs\imp\phase1-feature-progress-matrix.html)、[validate_phase1_matrix.mjs](G:\devwork\music-compose-tool\scripts\validate_phase1_matrix.mjs)、[implementation-context-reading-guide.md](G:\devwork\music-compose-tool\docs\guide\implementation-context-reading-guide.md)、[imp-tasks.md](G:\devwork\music-compose-tool\docs\imp\imp-tasks.md)。
- Proof: `npm.cmd run validate:matrix`（18 rows / 54 unique local links）、Chromeでmatrixを直接読み込み（18 rows / 175 file links / page error 0 / default UI class `ai-verified`）、既存`npm.cmd run check`（15 files / 58 tests）とChromium FHD 7/7をpass。

## 2026-07-22 APP-003: prototype operation parityと機能進捗マトリクス

- Humming StudioへAI生成範囲（曲全体 / 選択section / 伴奏だけ）と対象sectionを追加した。範囲はsymbolic accompaniment request、local fallbackのnote適用、ACE-Step追加layerのjob payload / clip位置へ反映し、選択section再生成時は範囲外の既存generated noteを保持する。
- 60分DAWへ`全曲内の表示位置` range controlとsection overview（Intro / Build / Drop / Break / Bridge等から表示）を追加し、Canvasの横スクロールと同期した。section roleは色ではなくneutralな線種で区別する。既存のCanvas note編集、inspector、audio clip、mixer、automation、MIDI入力は維持した。
- static prototypeの操作差分を機能行×`UI / 操作`、`実装 / データ`、`動作確認`、`テスト`、`運用・外部ゲート`へ分解した`phase1-feature-progress-matrix.html`を追加した。P1ユニット完成度表とは別に、feature単位の横断状況と外部gateを確認できる。ツールセットの`audit-design-documentation-coverage`スキルに従い、各セルから正本・最小実装境界・証跡へ辿れるようにした。
- 主語ファイル: [AccompanimentPanel.tsx](G:\devwork\music-compose-tool\src\features\humming\AccompanimentPanel.tsx)、[home-ai-gateway.ts](G:\devwork\music-compose-tool\src\adapters\ai\home-ai-gateway.ts)、[home-ai-gateway.mjs](G:\devwork\music-compose-tool\tools\home-ai-gateway.mjs)、[DawMelodyEditor.tsx](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[phase1-feature-progress-matrix.html](G:\devwork\music-compose-tool\docs\imp\phase1-feature-progress-matrix.html)、[validate_phase1_matrix.mjs](G:\devwork\music-compose-tool\scripts\validate_phase1_matrix.mjs)、[phase1-completion.spec.ts](G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts)。
- Proof: `npm.cmd run lint`、`npm.cmd run typecheck`、`npm.cmd run test:gateway`、対象Vitest 3 files / 11 tests、全体Vitest 15 files / 58 tests、Chromium FHD phase1 completion 4/4、`npm.cmd run validate:matrix`（18 feature rows / 52 local links）をpass。全体`check`・PWA・dark QAも再実行済み。

## 2026-07-22 MIC-009: 鼻歌入力の対象小節範囲

- Humming Recorderへ`鼻歌を入れる小節数`（1 / 2 / 4 / 8 bars）を追加し、Sectionと開始小節と組み合わせて録音を差し込む範囲を指定できるようにした。選択範囲は`rangeEndTick`へ反映され、実録音の秒数とsection終端の短い方でclampする。
- 30秒録音制限、retake / take比較、Basic Pitch、Melodyの部分置換は維持した。スマートフォンでも選択項目へ到達できるようhumming target controlsを4列からresponsiveにした。
- 主語ファイル: [HummingRecorder.tsx](G:\devwork\music-compose-tool\src\features\humming\HummingRecorder.tsx)、[HummingRecorder.test.tsx](G:\devwork\music-compose-tool\src\features\humming\HummingRecorder.test.tsx)、[styles.css](G:\devwork\music-compose-tool\src\styles.css)、[foundation.spec.ts](G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts)。
- Proof: `npm.cmd run check`（14 files / 56 tests）、microphone range selectionを含むChromium FHD E2E 7/7、PWA QA、dark QA、progress syncをpassした。

## 2026-07-22 DAW-005: note inspectorによる直接編集

- 60分DAWへ`選択音符インスペクタ`を追加し、選択したnoteのpitch、開始tick、長さtick、velocityを数値入力できるようにした。複数選択時は直接入力をprimary noteへ、nudge操作は選択全体へ適用する。
- Pitch ±12 / ±1、grid前後移動、Length ±1 grid、Velocity ±8、複製、削除を実装し、`note/update-many` / `note/add-many` / `note/remove` commandへ接続した。Canvas drag、double-click、copy/paste、quantize、MIDI入力は維持した。
- 主語ファイル: [DawMelodyEditor.tsx](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx)、[DawMelodyEditor.test.tsx](G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.test.tsx)、[styles.css](G:\devwork\music-compose-tool\src\styles.css)、[phase1-completion.spec.ts](G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts)。
- Proof: `npm.cmd run check`（14 files / 56 tests）、Chromium FHD full E2E 7/7、PWA QA pass、dark QA pass（overflow / console / request failure 0）。

## 2026-07-22 DES-003: Patchtone Night Gridの暗色編集面ハードニング

- 選択中のsurface / phase / workspace tabを白反転から濃紺面＋pastel下線へ変更し、編集画面全体の黒〜濃紺の連続性を保った。主要primary buttonもcyan signal色に寄せ、黒い編集面から視線が飛ばないようにした。
- `--color-paper` / `--color-paper-2` / `--color-paper-3`、rule、editor black/gridの輝度を一段下げ、矩形境界と低彩度gridを維持した。角丸トークンは0pxのまま、円形操作の例外も変更していない。
- Production ReactとPastel静的prototypeは同じtokens.cssを参照するため、両面の暗色variantが同期する。操作名・aria selector・音声・保存・出力経路は変更していない。
- 主語ファイル: [tokens.css](G:\devwork\music-compose-tool\docs\design\prototypes\pastel-patchboard\tokens.css)、[styles.css](G:\devwork\music-compose-tool\src\styles.css)、[imp-tasks.md](G:\devwork\music-compose-tool\docs\imp\imp-tasks.md)。
- Proof: `npm.cmd run check`（14 files / 54 tests）、`npm.cmd run test:e2e`（Chromium FHD 7/7）、`npm.cmd run test:dark`（1440 / 768 / 375px、editor 1440px、overflow 0、console error 0、request failure 0）。証跡は[dark-theme-qa-2026-07-22.json](G:\devwork\music-compose-tool\docs\imp\evidence\dark-theme-qa-2026-07-22.json)とdark-theme PNG 4枚。

## 2026-07-22 ARR-009: production展開アセット候補選択

- Arrangement Editorへ`展開アセットを選ぶ` selectを追加し、static prototypeと同じTwin Drop / Gentle Rise / Story Breakをproductionで交換できるようにした。候補にはsection role、bars、energy、riser transitionを含め、`arrangement/replace`の1 commandとしてundo / redoへ通す。
- sectionカードへTransition select（なし / Soft Rise）を追加し、テンプレート交換後も各sectionのつなぎを個別に変えられるようにした。既存のdrag、前後移動、template追加・削除、block lane配置は維持した。
- melody notesはarrangement replaceで置換せず、古いsectionへ紐づくblockだけをdomainのnormalizeで整理する。候補選択後のblock配置・再生・保存は既存Project経路を利用する。
- 主語ファイル: [ArrangementEditor.tsx](G:\devwork\music-compose-tool\src\features\arrangement\ArrangementEditor.tsx)、[styles.css](G:\devwork\music-compose-tool\src\styles.css)、[project-domain.test.ts](G:\devwork\music-compose-tool\src\domain\music\project-domain.test.ts)、[foundation.spec.ts](G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts)。
- Proof: `npm.cmd run check`（14 files / 55 tests）、展開候補交換を含むChromium FHD foundation journey 1/1、`npm.cmd run validate:progress`（16 units / weight 100 / HTML同期true）。


## 2026-07-22 AUD-003: user audio placement / multi-track piano-roll / stem coverage

- Audio Paletteのuser-owned WAV / MP3へ`配置`操作を追加し、AI Layerのaudio laneへdurationをBPM / PPQから算出して`audio-clip/add`するようにした。配置後はWeb Audio preview、manual save、project bundle、master WAV、STEMSへ同じasset IDが届く。
- `createStemBundle`のtrack抽出をnotes / blocksだけでなくaudioClipsも含むように修正し、audio-onlyのAI Layerやuser layerをmanifestとWAV stemへ含める。`collectStemTracks` unit testでreference trackを確認した。
- 60分DAW画面はMelody固定をやめ、編集可能なnotes / drums laneを持つTrackとMain / Sub Laneを選択可能にした。選択中の伴奏trackでもdouble-click、pitch / timing drag、length resize、copy / paste、quantize、MIDI入力、undo / redoへ同じdomain commandを通す。
- 主語ファイル: `G:\devwork\music-compose-tool\src\features\audio\AudioPalette.tsx`、`G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx`、`G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx`、`G:\devwork\music-compose-tool\src\application\audio\exports.ts`、`G:\devwork\music-compose-tool\src\application\audio\exports.test.ts`、`G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts`、`G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts`。
- Proof: `npm.cmd run check`（14 files / 49 tests）、DAW track selector Chromium journey、user WAV配置→STEMS ZIP内`AI_Layer.wav`確認、全E2E 7/7をpassした。user assetを含むSTEMSの長いOfflineAudio renderがあるため、該当journeyのtimeoutを120秒へ設定した。

## 2026-07-22 INT-008: 直接録音のボイスメモ指示

- Humming Studioのイメージ指示へ、鼻歌とは別の`ボイスメモを録音`導線を追加した。既存の30秒MicrophoneRecorderを共有するが、録音結果は`audioBlobToWav`で22,050Hz PCM WAVへ正規化し、AudioEngineのprivate assetとして保存する。
- 保存後は`project/intent-media`の`spokenIntentAssetId`だけを更新し、鼻歌take、Melody notes、`activeTakeId`を変更しない。次回のACE-Step full-track requestではspoken assetをreference audioとして送る既存経路を利用する。
- 失敗時はpermission / unsupported / decode / importエラーをstatusへ出し、録音中の停止操作とunmount cleanupを提供する。
- Proof: `tests/e2e/foundation.spec.ts`でボイスメモ録音→停止→`ボイスメモ指示 1件`確認後、同一画面で鼻歌録音を継続するChromium FHD journeyをpass。`tests/e2e/phase1-completion.spec.ts`では、直接録音したvoice memoがACE-Step条件付きfull-track requestのreference audioへ届くことも確認した。`npm.cmd run check`（14 files / 54 tests）もpassした。主語ファイルは`G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx`、`G:\devwork\music-compose-tool\src\adapters\humming\basic-pitch-transcriber.ts`、`G:\devwork\music-compose-tool\tests\e2e\foundation.spec.ts`、`G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts`。

## 2026-07-22 DAW-004: project settings and addable note tracks

- 「曲の設計」へ作成後に変更できるLength / Mood / Key / BPM controlsを追加した。`project/settings` commandはrevision、undo / redo、manual saveに接続し、BPMとtarget lengthからarrangementの合計barsを再計算して再生・AI条件へ反映する。
- 60分DAWへ追加track種別（Lead / Synth / Pad / Arp / Percussion / FX）、Main / Sub lane生成、Track selector、Lane selectorを追加した。伴奏を作った後も任意のnote trackへCanvas編集・MIDI入力・mixer / automationを切り替えられる。
- 主語ファイル: `G:\devwork\music-compose-tool\src\domain\music\project-commands.ts`、`G:\devwork\music-compose-tool\src\domain\music\project-domain.test.ts`、`G:\devwork\music-compose-tool\src\features\projects\WorkspaceShell.tsx`、`G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx`、`G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts`。
- Proof: `npm.cmd run check`（14 files / 50 tests）、project settings + Track selectorを含むChromium DAW journeyをpass。既存のmelody lock、custom section、project migration testsも維持した。

## 2026-07-22 MIX-005: instrument exchange reaches audio runtime

- 60分DAWのmixerへbuilt-in音色selectを追加し、track/mixerの`instrumentId`変更を1 commandで保存・undo可能にした。reference/audio laneでは音色selectを表示せず、symbolic note / drum laneだけを対象にする。
- `buildProjectAudioPlan`はfactoryの旧alias（`pearl-lead`等）を互換解決し、trackの選択instrumentをassetRefsのcategory fallbackより優先する。したがってselect変更はWeb Audio previewとOfflineAudio WAV renderの双方へ届く。
- 主語ファイル: `G:\devwork\music-compose-tool\src\domain\audio\audio-plan.ts`、`G:\devwork\music-compose-tool\src\domain\audio\audio-plan.test.ts`、`G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx`、`G:\devwork\music-compose-tool\src\styles.css`、`G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts`。
- Proof: `npm.cmd run check`（14 files / 51 tests）、`audio-instrument` unit、Chromium DAW journeyの`Melody 音色` select変更をpassした。user-owned音源は引き続きprivate AudioClip経路でbuilt-inと混同しない。

## 2026-07-22 AUD-006: range-loop transport behavior

- `Loop on`をdomain flagだけで終わらせず、realtime preview専用の`buildProjectPlaybackPlan`へ接続した。指定範囲を4回反復して有限previewにし、停止操作が可能なままsymbolic notesを繰り返す。
- user / AI audio clipsも同じPPQ範囲へ再配置し、loop境界を越えるclipは範囲内へclampする。WAV/STEMS exportは従来どおり全曲用`buildProjectAudioPlan`を使い、loop previewで書き出し内容を短縮しない。
- 主語ファイル: `G:\devwork\music-compose-tool\src\domain\audio\audio-plan.ts`、`G:\devwork\music-compose-tool\src\domain\audio\audio-plan.test.ts`、`G:\devwork\music-compose-tool\src\adapters\audio\web-audio-engine.ts`。
- Proof: `npm.cmd run check`（14 files / 52 tests）でloop playback planの4反復、通常export duration維持、既存AudioPlan/FX testsをpassした。

## 2026-07-22 AUD-007: 音声レイヤー詳細編集

- 生成・ユーザー音声を配置したaudio laneを60分DAW画面の`音声レイヤー`パネルへ表示し、開始tick、長さtick、Gainを編集できるようにした。削除操作は既存の`audio-clip/remove`へ接続し、配置済みaudio-only trackのSTEMS・WAV・project bundle経路を維持する。
- `src/features/melody/DawMelodyEditor.tsx`へ`AudioClipEditor`を追加し、built-in asset名またはasset ID、track / laneを表示する。数値はgridと全曲範囲でclampし、無効な長さを作らない。
- `src/features/melody/DawMelodyEditor.test.tsx`で位置変更、Gain変更、削除のcommandを検証した。`tests/e2e/phase1-completion.spec.ts`でWAV配置→DAW音声レイヤー表示→位置／Gain編集をChromium FHDで確認した。
- `npm.cmd run check`（14 files / 54 tests）、`npm.cmd run test:e2e`（7/7、56.3秒）をpass。主語ファイルは`G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx`、`G:\devwork\music-compose-tool\src\styles.css`、`G:\devwork\music-compose-tool\tests\e2e\phase1-completion.spec.ts`。

## 2026-07-22 DES-002: Patchtone Night Grid visual refinement

- Pastel Patchboardの情報設計とpastel signal色を維持したまま、白ベースを廃止し、Project Home / Workbenchを黒〜濃紺のDTM surfaceへ更新した。情報カード・入力・タグの角丸トークンは0pxに統一し、ヘルプ・録音・再生などの円形操作だけを明示的な円形例外として残した。
- 60分仕上げのCanvas piano-rollは`--color-editor-black`を基底にし、低彩度gridとcyan / mint / lavender / pinkのノート状態を重ねる。production Reactと静的prototypeの両方へ同じ編集面の意図を反映した。
- PWAの`color-scheme`、theme color、manifest、iconも暗色variantへ同期した。UI操作構造、録音、asset audition、responsive layout、アクセシビリティ用focus色は変更していない。
- 主語ファイル: `G:\devwork\music-compose-tool\tokens.css`、`G:\devwork\music-compose-tool\src\styles.css`、`G:\devwork\music-compose-tool\src\features\melody\DawMelodyEditor.tsx`、`G:\devwork\music-compose-tool\docs\design\prototypes\pastel-patchboard\theme.css`、`G:\devwork\music-compose-tool\docs\design\prototypes\shared\workbench.js`、`G:\devwork\music-compose-tool\scripts\qa_dark_theme.mjs`。
- Proof: `scripts/validate_design_prototypes.py`、`npm.cmd run check`（Vitest 14 files / 48 tests、build、進捗同期）、`npm.cmd run test:e2e`（Chromium 7/7）、`npm.cmd run test:pwa`、`npm.cmd run test:dark`（1440 / 768 / 375px home + 1440px editor、overflow 0、console error 0、request failure 0）をpassした。証跡は`G:\devwork\music-compose-tool\docs\imp\evidence\dark-theme-qa-2026-07-22.json`とPNG 4枚。
- 判断: Pastelは色の軽さではなく、音楽状態の信号色として残す。編集面を最も暗くし、矩形の境界・余白・線種で情報をまとめることで、Studio One系の作業面に寄せる。

## 2026-07-22 P1 completion hardening / browser QA / ACE-Step gateway proof

- `DawMelodyEditor`へCanvas note add・pitch/timing drag・length resize、複数選択・copy/paste・quantize・loop、mixer、FX、automation、Web MIDI note-on/offを接続し、`ToneAudioEvent`のFX値をWeb Audio再生とOfflineAudioContext WAV renderへ反映した。
- `project-bundle.ts`へuser-owned audio metadataとbinary payloadの同梱 / import復元を追加し、`MemoryAudioAssetRepository` round-trip testを追加した。Project fileは256MiB上限、CRC、metadata/path検査を維持する。
- Humming Studioへ文章指示、mood chip、参考音声 / ボイスメモimportを追加し、Project intentとAI requestを分離したまま`project/intent` / `project/intent-media`へ保存する。intent variantは伴奏テンプレートとgateway requestへ反映する。
- `tools/home-ai-gateway.mjs`のACE metrics読み取りを実ピーク優先へ修正。RTX 5080上でDiT-only 10秒full-track jobをgateway経由で`succeeded`、artifact HTTP 200、48kHz stereo、peak reserved 7,500MiB（hard cap 10,240MiB）で確認した。処理後のgatewayは停止し、モデル常駐を残していない。
- 鼻歌takeを22,050Hz PCM WAVへ正規化し、gatewayの一時base64 source audioと参考音声からACE-Step `complete` taskへ条件付けする経路を追加した。RTX 5080上のgateway実測は5.12秒、artifact HTTP 200、48kHz stereo、peak reserved 9,622MiB（hard cap内）、source/reference file削除、public jobへのbase64非露出を確認した。証跡は`docs/imp/evidence/ace-step-conditioned-gateway-2026-07-22.json`。
- Playwright Chromium FHDはfoundation / microphone / Basic Pitch / DAW-MIX / 鼻歌source＋voice/reference音声を条件にしたAI追加layer・intent refine・Patchboard handoff / WAV-STEMS-MIDI download / Misskey投稿の7/7 pass。Browser QAは`http://127.0.0.1:4173/`の1440 / 768 / 375pxでhome・Patchboardを観測し、horizontal overflow 0、critical console error 0、request failure 0。証跡PNGは`docs/imp/evidence/`へ保存した。
- `npm.cmd run lint`、`npm.cmd run typecheck`、Vitest 14 files / 48 tests、`npm.cmd run test:gateway`、`npm.cmd run build`、`npm.cmd run test:e2e` 7/7、`npm.cmd run test:pwa`（production previewのmanifest / service worker scope / shell cache）、`npm.cmd run validate:progress`（16 units / weight 100 / HTML同期true）をpassした。
- PWA runtime証跡を`docs/imp/evidence/pwa-runtime-qa-2026-07-22.json`へ固定した。appの`/sw.js`登録呼び出し2件、`autoRegistered: true`、controller、scope、`patchtone-shell-v1` cacheを記録し、install promptだけをexternal gateとした。
- `npm.cmd run test:pwa`を`run_pwa_qa.mjs`経由へ変更し、production preview（4174）の起動・待機・QA・終了を1コマンドで再現可能にした。既存の開発サーバーや手動登録状態へ依存しない。
- 星取り表はP1-MIDI / P1-PWA / P1-SHR / P1-QAをlocal primary proof付きverifiedへ更新し、local verified scoreを100/100へした（verified行のweight合計と一致）。PWA QAは登録呼び出しを実測し、QA fallback前のapp自動登録を確認した。実MIDI機器、Misskey実instance投稿、X OAuth、PWA install promptの実機確認はexternal / residual gateとして残す。
- 再利用知識を`G:\knowledge-vault\knowledge\dev\editable-audio-layer-and-bundle-pattern.md`へ、作業記録を`G:\knowledge-vault\records\2026-07-22-music-compose-tool-phase1.md`へ同期した。

## 2026-07-22 P1-DAW / P1-MIX hardening（/root/daw_hardening）

- `src/features/melody/DawMelodyEditor.tsx`のCanvasピアノロールへノート右端の`ew-resize` hit areaとpointer captureを追加し、選択中の複数ノートを同じ操作でlength変更できるようにした。最小長は現在grid、終端は曲長にclampし、通常drag（pitch / timing）と区別する。
- `src/domain/music/project-commands.ts`へ`note/add-many` / `note/update-many`を追加し、複数ノートのdrag、Quantize、Pasteを1 command・1 undo単位へまとめた。既存のnote add/removeとの互換性を保ち、batch addではduplicate IDをrejectする。
- `DawMelodyEditor`へtrack選択式のFX panel（filter / reverb / delay / sidechain）と、volume / panを含むautomation parameter selector、point追加・tick/value/curve編集・削除を追加した。操作は既存の`track/mixer` / `automation/set`へ保存され、保存・undo経路へ接続する。
- `src/domain/music/project-domain.test.ts`へbatch commandの一回undoとautomation point保持のunit test、`src/features/melody/DawMelodyEditor.test.tsx`へFX/automation UI command接続testを追加した。
- 検証: 対象ESLint PASS、`npm run lint` PASS、`npm run typecheck` PASS、Vitest 14 files / 41 tests PASS（Web MIDI note-on/offのlength確定testを含む）、`npm run build` PASS。Playwrightは3件中2件PASS（foundationのresource 502 console errorのみ失敗、microphone / Basic PitchはPASS）。
- 残課題: automation値をWeb Audioの実filter/reverb/delay/sidechainノードへ反映するruntime証跡、MIDI複数入力の実機検証、Playwrightの502原因調査はP1残作業として別unitで継続する。

## 2026-07-22 P1-DAW / P1-MIX / P1-EXP / P1-MIDI vertical slice

- `src/features/melody/DawMelodyEditor.tsx`へ高密度ノートDOMを作らないCanvasピアノロールを追加した。1/8・1/16・1/16 triplet・1/32 grid、double-click追加、Shift複数選択、drag pitch/timing、Delete、copy/paste、quantize、zoom、範囲loop、M/S/volume/pan、MIDI入力入口を備える。60分仕上げphaseでのみ表示する。
- `src/domain/audio/audio-plan.ts`へtrackのmute / solo / volume / pan反映とarrangement全体のpreview長計算を追加した。`src/application/audio/exports.ts`でmaster WAV、trackごとのSTEMS zip、Standard MIDI、既存project bundleを出力する。
- `tools/home-ai-gateway.mjs`とbrowser clientをVite proxyへ接続し、伴奏ジョブは10,240MiB hard cap・queue 4・concurrency 1・生成時ロード/完了時unloadを維持する。ACE-Step未設定時は編集可能symbolic fallbackを適用し、鼻歌melodyを変更しない。
- `public/sw.js`とproduction登録を追加し、PWA shell cacheを用意した。X / Misskeyはcredential-free share intentを追加し、actual postはinstance/token gateの外部確認へ分離した。
- 検証: `npm.cmd run lint`、`npm.cmd run typecheck`、`npm.cmd test`（13 files / 32 tests）、`npm.cmd run test:gateway`、Playwright 3/3（gateway起動付き）をpass。
- 残り: length resize / automation / FX parameter UI、実MIDI device/note-off、WAV/STEMSブラウザparse、ACE-Step実artifact/VRAM再実測、SNS live投稿、PWA install実機QA。

## 2026-07-22 P1-AI local gateway boundary / fallback

- `tools/home-ai-gateway.mjs`を追加し、`127.0.0.1:17321`のhealth・非同期job・artifact endpointを実装した。Viteの`/api/home-ai` proxyから利用でき、public bind・Cloudflare・credentialを作成しない。
- jobは`accompaniment`または`full-track`だけを受け付け、body 8MiB、melody 512音、生成長1–30秒、BPM 40–240、queue 4件、GPU concurrency 1で検査する。`Idempotency-Key`で重複投入を抑止し、malformed / unsupported / queue fullを正規化error codeで返す。
- ACE-Stepは`HOME_AI_ENABLE_ACE_STEP=1`と専用Python / script / checkpointを明示した時だけ起動する。profileは実測済みDiT-only（peak reserved 7,504MiB）のみをallowlistし、1 process 10,240MiB hard capをmetrics再検査する。未設定時と伴奏jobはTemplate / Rule Engineへfallbackする。
- fallbackは鼻歌noteを変更せず、Chord / Bass / Drumのeditable main / sub lane、intent trace、melody-preserved provenanceを返す。AIのflat完成音声をProject唯一の正本にしない。
- `src/adapters/ai/home-ai-gateway.ts`にhealth、submit、poll、timeout、job id検査の型付きbrowser clientを追加し、`src/adapters/ai/home-ai-gateway.test.ts`でhealthのpath秘匿、melody payload、idempotency、fallback pollingを検証した。
- `docs/arch/local-ai-gateway-contract.md`へ起動、endpoint、VRAM lifecycle、安全境界、fallback、Cloudflare非対象を記録した。既存の`docs/arch/home-model-serving-topology.md`の10GiB方針と矛盾しない。
- 検証: `node --check tools/home-ai-gateway.mjs`、`npm run test:gateway`（ephemeral portでhealth / POST / GET / idempotency）、対象clientのESLint、`npm.cmd run check`（lint、typecheck、Vitest 13 files / 32 tests、gateway smoke、build、progress sync）をpass。DawMelodyEditorのhook warningも解消済み。

## 2026-07-22 P1-MIC real microphone / Basic Pitch transcription

- `getUserMedia`と`MediaRecorder`をportの背後へ実装し、mono、echo cancellation / noise suppression / auto gain off、runtime MIME選択、30秒自動停止、明示停止、全media track解放、permission拒否 / unsupported messageを備えた。
- Humming Studioで対象sectionと開始小節を選び、30秒以内のtakeを録音またはWAV / MP3 / WebMから読み込める。raw Blobは別IndexedDBへprivate保存し、複数takeをaudio controlで試聴比較してMelody採用takeを切り替えられる。
- `@spotify/basic-pitch` package内modelをbuild前に`public/models/basic-pitch`へ同期し、dynamic importで必要時だけ読み込む。通常AudioContextが44.1kHzへdecodeして推論を拒否する問題を実E2Eで検出し、22,050Hz解析Contextへ修正した。
- 音符候補はPPQ 480 tickへ変換し、target range内へclip、pitch / timing lock、confidence、provenanceをProjectのHummingTakeとMelody laneへ保存する。旧`1.0.0` takeは`transcribedNotes: []`へ互換migrationする。
- `npm run check`はlint、typecheck、Vitest 10 files / 26 tests、production build、星取り表同期をpass。Basic Pitchは別dynamic chunk 1,033.31kB（gzip 257.33kB）でmain chunkから分離した。
- Full HD Chrome Playwright 3/3で既存作曲journey、fake microphone permission / stop、3.2秒4音WAVの実Basic Pitch推論・Melody適用をpass。実model testは約6.4秒、console / page error 0。
- 未確認は実際の人声・環境noise・iOS / Android・Edge、複数端末latencyと主観精度。外部network、credential、SNS post、Cloudflare、public deployは実行していない。

## 2026-07-22 P1-HAR melody-preserving editable accompaniment

- melody noteを小節単位で解析し、Project keyのdiatonic chord候補からmelody pitch classとの一致scoreが高いchordを選ぶdeterministic harmonizerを実装した。外部modelがなくても常に利用できるbaselineとする。
- melody laneは一切変更せず、lockPitch / lockTimingも保持する。Chord / Bass / Drum / Pad / Arp / Synthの6 trackへgenerated noteを分け、dropではChord / Bass Sub lane、DrumはMain / Sub、他も役割別laneへ書く。
- 伴奏applyは1 commandで原子的に実行し、既存の手編集noteを残してgenerated noteだけを再生成する。使用assetとprovenance candidate / intent traceもProjectへ保存する。
- 鼻歌未入力時だけ明示選択できる16-note template starterを追加した。録音後は同じmelody/replace commandでhumming notesへ差し替えられ、伴奏を再生成できる。
- Project audio planはgenerated chord / bass / drum / pad / arp / synth notesがある場合にそれをscheduleし、flat audioではなく編集可能noteを実際に再生する。
- Full HD Chrome E2Eでtemplate melody、16 note表示、6 editable track生成、melody lock表示、生成伴奏の再生、保存・reloadを通し、console error 0。1920x1080 Humming Studioはhorizontal overflow 0。
- `npm run check`はlint、typecheck、Vitest 20/20、build、進捗同期をpass。Playwright 1/1もpassした。buildはCSS 32.61kB（gzip 6.19kB）、JS 354.02kB（gzip 109.15kB）。
- real microphone / Basic Pitch、AI model、external network、SNS postはこのunitで実行していない。

## 2026-07-22 P1-ARR arrangement / block / main-sub lane

- 「展開を整える」をProject commandへ接続し、Intro / Verse / Build / Drop / Break / Bridge / Outro template追加、bars / energy変更、削除、HTML drag event、前後buttonの並べ替えを実動作化した。
- section roleはtrack色と競合しないneutral frame形状で区別した。追加・更新・並べ替え後は`startBar`を連続化し、既定56 barsのようにstandard select外の長さも正しく表示する。
- 選択済みbuilt-in assetごとに対象trackのMain / Sub laneを表示し、section cellの1 clickで`MusicBlock`を配置 / 解除するpuzzle boardを追加した。
- section-bound blockは`parentBlockId`を保持し、section reorder / bars変更へstart / durationが追従し、section削除時は孤立blockを除去する。block / section duplicateとrangeをvalidatorへ追加した。
- 全画面共通Undo / Redoをworkspace headerへ接続した。section、block、asset操作を同じimmutable command historyで戻す。
- Full HD Chrome E2EでBridge追加、undo / redo、drag event reorder、前後button、Chord Main / Sub block配置、undo、保存・reloadを通し、console / React warning 0だった。1920x1080の8 section / lane matrixはhorizontal overflow 0。
- `npm run check`はlint、typecheck、Vitest 17/17、build、進捗同期をpass。Playwright 1/1もpassした。buildはCSS 29.97kB（gzip 5.91kB）、JS 345.36kB（gzip 106.62kB）。
- microphone、AI model、external network、SNS postはこのunitで実行していない。

## 2026-07-22 P1-AUD realtime audio / asset import

- domainのpure `AudioEventPlan`とbrowser Web Audio adapterを分離し、ProjectのBPM / key、選択asset、melody noteから8小節のdeterministic Future Bass/Core previewをscheduleする。humming melody noteがある場合は生成melodyで置換せず、そのpitch / timingをleadとして鳴らす。
- oscillator、filter、gain envelope、stereo panner、compressorとdeterministic noiseからchord、drum、bass、lead、synth、pad、arp、percussion、FX、transitionの10種built-in assetを実装した。全assetはカード内の1 click / tapで2.5秒以下のphraseを試聴できる。
- workspace上部に書き出し不要のProject再生 / 停止transportを追加した。停止時とcomponent破棄時にactive `AudioScheduledSourceNode`を停止する。
- WAV / MP3 importは128MiB、10分、mono / stereo、8–192kHz上限、extension、magic bytes、browser decode、SHA-256を検査し、user-owned private assetのBlobとmetadataを別IndexedDBへ保存する。
- Full HD Chrome E2EでSoft Supersaw試聴、Projectへ採用、実生成PCM WAVのdecode / import、private library表示、Project preview再生 / 停止、manual save、page reload後のProject / audio asset再読込を通し、console / page error 0だった。
- `npm run check`はlint、typecheck、Vitest 16/16、build、進捗同期をpass。Playwright 1/1もpassした。buildはCSS 23.94kB（gzip 5.10kB）、JS 336.07kB（gzip 104.22kB）。
- 1920x1080で10 asset card、transport、workspace tabsを目視し、horizontal overflow 0。実speakerでの主観音質評価、cross-browser latency、offline renderは後続gateとする。
- microphone、AI model、external network、SNS postはこのunitで実行していない。

## 2026-07-22 P1-PRJ Project Home / manual save / project bundle

- production entrypointをProject Homeへ置き換え、「鼻歌から一曲」と「パッチボードで組む」を同格の開始surfaceとして実装した。新規作成時にtitle、genre、長さ、雰囲気、key、BPMをProject条件として設定する。
- 保存済みProject shelfから本来のsurfaceまたは別surfaceで同じProjectを開ける。Humming Studioは録音を最初のactionにする独立画面、Patchboardは曲の設計・音・展開・melodyの4 workspaceを持つ画面として分離した。
- IndexedDB `patchtone-projects`へSave click時だけProjectを保存し、autosaveを行わない。dirty時だけclose warningを有効にし、保存後は解除するunit testをpassした。
- JSZipで`.mctproj`を作成し、`bundle.json`とproduction `project.json`を格納する。read時に256MiB上限、CRC、format / version、manifestとProjectのID / title一致、Project migration / validationを検査する。
- Full HD Chrome E2Eで新規Humming Project作成、未保存表示、manual save、一覧復帰、`.mctproj` download、page reload後のIndexedDB再読込、同file importを通し、console / page error 0だった。
- `npm run check`はlint、typecheck、Vitest 11/11、build、進捗同期をpassした。buildはCSS 19.20kB（gzip 4.49kB）、JS 316.77kB（gzip 98.42kB）。Playwright 1/1もpassした。
- 1920x1080でProject作成panelとHumming Studio、375x812で新規作成full pageを目視し、横overflow 0。未定義Pastel token参照をvisual QAで検出し、既存tokenへ修正した。
- audio asset、microphone、model、external network、SNS postはこのunitで実行していない。

## 2026-07-22 P1-DOM production music domain / schema

- `formatVersion 1.0.0`、PPQ 480のProject正本を追加し、creative intent、arrangement、melody ownership、11 instrument track、全trackのmain / sub lane、note / block / audio clip、mixer、FX、automation、humming take、AI candidate、loopを型として固定した。
- 新規Project factoryはFuture Bass / Future CoreのBPM既定値、Intro / Verse / Build / Drop / Break / Bridge / Drop / Outroの連続sectionと、melody / chord / drum / bass / lead / synth / pad / arp / percussion / FX / transition trackを作る。
- command historyでnote add / update / remove、track / lane追加、mixer、arrangement、automation、loopをimmutableに更新し、undo / redo時もrevisionを単調増加させる。manual saveだけが`savedRevision`を進める。
- Phase 0 `0.1.0` Project fixtureをproduction melody main laneへ移すmigrationを追加し、未知versionと不正contractは拒否する。
- portable contractを`docs/spec/schema/v1/project-manifest.schema.json`へ追加した。Phase 0 validatorが直下3 schemaを対象にする境界を保つためversion directoryへ分離した。
- `npm run check`でlint、typecheck、Vitest 7/7、production build、進捗同期をpassし、schema JSON parseもpassした。最初のgateでVitestがPlaywright specまで収集する問題を検出し、unit test includeを`src/**/*.test.{ts,tsx}`へ限定した。
- browser storage、file download、Web Audio、microphone、model、network、external postはこのunitで実行していない。

## 2026-07-22 P1-FND production scaffold

- React / React DOM 19.2.7、TypeScript 6.0.3、Vite 8.1.5、Vitest 4.1.10、Playwright 1.61.1をexact pinし、npm 11.16.0で312 packageを導入した。`npm audit`は0 vulnerability。
- strict TypeScript、typed ESLint、Vitest、Playwright、local-only Vite server / preview、manifest、Pastel tokenを読み込むproduction entrypointを追加した。
- Runtime adapter候補として`idb` 8.0.3、JSZip 3.10.1、`@spotify/basic-pitch` 1.0.1をpinした。Basic Pitch package内にmodel JSON / shard約0.9MBが同梱され、Apache-2.0 licenseであることを確認した。
- `npm run check`でlint、typecheck、Vitest 1/1、production build、progress同期をpassした。build outputはHTML 0.71kB、CSS 5.96kB、JS 191.92kB（gzip 60.78kB）。
- local dev server `http://127.0.0.1:4173/`はHTTP 200。installed Chromeを使うPlaywright FHD journey 1/1が347msでpassし、console error 0だった。
- 最初のgateでVitest config typingとtyped ESLint適用範囲の誤りを検出・修正した。Playwright failure video用FFmpegは追加せず、trace / screenshotだけを採用した。
- external API、microphone、model推論、SNS post、Cloudflare、commit、push、deployはこのunitで実行していない。

## 2026-07-22 Phase 1 blueprint・進捗星取り表

- ユーザーが広いproduction実装を明示的なGoalへ切り替え、明朝までに「なんとなく音楽が作れる」local Web / PWAを最初のmilestoneとした。
- `docs/imp/phase1-blueprint.md`へ16 construction units、依存、authority、Primary proof、weight合計100、M1〜M4 milestone、risk-first decision、recovery / handoffを定義した。
- `docs/imp/phase1-progress.md`を進捗正本、`docs/imp/phase1-progress.html`を人間向け星取り表とした。verified unitだけをscoreへ加算し、作業量の自己申告でpercentを増やさない。
- `scripts/validate_phase1_progress.mjs`でMarkdown / HTMLのID、status、weight同期を検証し、16 unit、weight 100、`htmlSynchronized: true`を確認した。
- Chrome headless 1920x1080でHTMLを描画し、summary、filter、unit表、明朝demo path、外部gateが判読でき、横切れと文字重なりがないことを目視確認した。長い表は縦scrollする。
- SNS actual postをPhase 1へ追加した。adapter実装と、Misskey instance / tokenまたはX OAuthを必要とするlive E2Eを別gateにし、credential待ちでlocal実装を止めない。
- 製品source、dependency、外部post、Cloudflare resource、commit、push、deployはこのplanning unitでは変更していない。

## 2026-07-22 P1-EXP / P1-MIDI / P1-SHR export・MIDI・share hardening

- `src/application/audio/exports.ts`へ、lane name / tempo metaを含むStandard MIDI format 1 writer、note-off先行順序、空lane fallback、`parseMidiFile`（durationTick復元、running status、meta / sysex / truncated検査）を追加した。
- 同fileへ`parseWavHeader`（RIFF/WAVEのfmt/data chunk、sample rate、duration）と`parseStemBundle`（JSZipのmanifest、master / stem WAV envelope、manifest/file count consistency）を追加し、STEMSの同名track出力はsuffixで衝突を回避する。
- `src/features/melody/DawMelodyEditor.tsx`のWeb MIDI入力は、input/channel/pitchごとにnote-onをactive mapへ保持し、note-offまたはvelocity 0で実経過tickからdurationTickを`note/update`へ確定する。重複同音、再接続時handler置換、unmount cleanupを含む。
- `src/application/share/share-intent.ts`へMisskey root URL正規化、http(s)以外のunsafe URL除去、tokenを扱わないcredential-free intent adapterを追加した。actual postは外部資格情報gateとして残した。
- Fixture / negative proofを`src/application/audio/exports.test.ts`、`src/application/share/share-intent.test.ts`へ追加した。`src/features/melody/DawMelodyEditor.test.tsx`のfake MIDI device testを含め、`npm.cmd run lint`、`npm.cmd run typecheck -- --pretty false`、Vitest 14 files / 41 testsがpassした。実MIDI機器、browser download実機、SNS actual postは未検証のためP1 progress上はactive / externalである。

## 2026-07-21 Pastel project foundation・arrangement drag・whole-song Canvas editor

- 長さ・雰囲気・key・BPMをpersistent headerから外し、新規project作成と先頭の「曲の設計」workspaceへ移した。4条件はasset推薦、展開長、互換性、再生tempoに使うproject-wide stateとし、AI panelの文章指示・参考音・生成範囲とは分離した。AI欄には自動参照するproject条件のread-only summaryを表示する。
- workspaceを「曲の設計」「音を組む」「展開を整える」「メロディ編集」の4面にした。音のピース開始は曲の設計から、鼻歌開始は30分melodyのfake transitionから始まる。
- 展開にBridgeを追加してBreakと別roleにし、Intro / Build / Drop / Break / Bridge / Outro template追加、pointer drag並べ替え、前後移動button、削除を実装した。section roleはneutralな枠形状、track roleはpastel色のままとした。10分の固定説明は常時copyを削除し、disabled selectのtooltipへ移した。
- 鼻歌はsection・開始小節・長さを指定し、その範囲へ6音のhumming seedを差し込むfake journeyにした。曲全体のmelodyを置き換えない。
- Studio One公式資料とWHATWG / W3C / Khronos仕様を調査した。Studio Oneはhardware accelerationとLinuxのVulkan 1.1 / OpenGL ES 2要件を確認できたが、piano roll内部rendererは未公開である。内部実装再現とは表現せず、PPQ 480 whole-song data、high-DPI Canvas 2D、viewport culling、Pointer Events / pointer capture、audio render分離を採用した。報告: `docs/research/precision-music-editor-rendering-architecture-2026-07-21.md`。
- 60分editorへ全曲overview、zoom / scroll、1/16・1/16T・1/32 snap、縦横dragによるpitch / timing、右端dragによるlength、空白double-click add、Delete、duplicate、quantize、velocity、keyboard矢印、undo / redoを実装した。P1は複数選択・copy / paste・範囲loop、後段はautomation / MPE / plugin editとした。
- static design gate、JavaScript syntax、JSON parse、Phase 0 contract positive 3 / negative 3、`git diff --check`をpassした。Chrome 150でHallmark履歴とPastel 3 surfaceを1440 / 768 / 414 / 375 / 320pxの全20 viewportで確認し、viewport issue、interaction failure、console errorは0。Pastel 44操作がpassした。
- 最終interaction runはdetail DOM 413、note DOM 0、全曲note 42、viewport draw 6、Canvas draw 2.4ms、Playwright 8-step pointer journey 100.3ms、同期render 3.6msだった。実操作は`F#4 / 15360 tick`から`G4 / 15840 tick`へのdrag、resize、double-click `42 -> 43`、Delete `43 -> 42`を確認した。performance budgetは未決のため、測定値を合否thresholdにはしていない。
- 実microphone、実音源asset、Basic Pitch、外部model / API、network送信、file出力、依存導入、deploy、commit、pushは行っていない。

## 2026-07-21 Pastel Patchboard選択とworkbench refinement

- ユーザーが、余計な丸・角丸が少なくHallmark案よりかなり好みに合うとしてPastel Patchboardを選択した。`PROJECT.md`、`docs/design/design-directions.md`、brand state、Product要件、stack、implementation readiness、`JUDGE-002`へproduction visual正本として同期した。Hallmark案は比較履歴として保持する。
- main workbenchから大きなproject title / subtitleを外し、project名をcompact表示にした。10分 / 30分 / 60分phaseは固定headerから作曲条件moduleへ移し、Pastel header自体もnon-stickyにした。状態見本は常時表示せず、円形`?` help disclosureへ退避した。
- asset groupをコード、ドラム、ベース、リード、シンセ、パッド、アルペジオ、パーカッション、FX、つなぎの10種へ拡張し、track gridを9系統へ増やした。展開assetは`Twin Drop`、`Gentle Rise`、`Story Break`の3候補から選択し、section label / bar / flow summaryへ反映する。
- model UIはBasic Pitch TS、ACE-Step 1.5 DiT-only、CLAP、Template / Rule Engineのcapability別routeと状態をdisclosure表示する。同じ目的のmodelを手動選択するpickerは追加していない。
- 再生buttonのuser gesture後だけ、Web Audio `AudioContext`の低音量triangle / sine内蔵シンセをscheduleするrealtime previewを追加した。書き出し不要でprogressと同時に鳴るが、実asset mix、production scheduler、mobile実機audioの完成とは表現しない。unsupported時はtimeline-onlyへdegradeする。
- `frontend-design`の情報階層・visual system規律によりPastelの一般radiusを0–2pxへ縮小し、円形はhelpとpatch接続口に限定した。`browser-qa`でlocal loopback / Chrome 150.0.7871.127を確認した。途中、mobileのwordmark非表示後にbrand linkが26x44pxへ縮む問題を3 viewportで検出し、44x44pxへ修正した。
- 最終検証: 2案 x desktop / tablet / 414 / 375 / 320の10 viewportでoverflow、console、network、HTTP、duplicate ID、unnamed control、44px未満touch target、wrapped controlのissue 0。Pastelのasset 10種、展開選択、help、model表示、humming / AI state、melody edit、undo / redo、save、Web Audio preview、share local-only、keyboardを含む19操作pass、interaction console error 0。
- static design gate、contrast、JavaScript syntax 3 / 3、JSON 14 / 14、project contract positive 3 / negative 3、`git diff --check`をpassした。microphone、external audio / asset、real model、network、file write、external post、dependency、deploy、stage、commit、pushは行っていない。

## 2026-07-21 Service readiness preparation sprint

- 承認・判断待ちをworkstream単位で横積みし、Phase 0でexternal effectなしに完了できるproject data、asset / license、design比較、fake境界、vertical slice、stack、再利用templateを依存順に整備した。
- `docs/spec/project-and-music-data-contract.md`、JSON Schema 3件、positive fixture 3件、negative fixture 3件、`scripts/validate_phase0_contracts.py`を追加した。project、humming asset、arrangementをpassし、invalid note、path traversal、arrangement length mismatchを意図どおりrejectした。
- `docs/research/audio-asset-format-and-license-boundaries-2026-07-21.md`へ、WAV PCM 48kHz candidate、browser capture / decode / render / download、Studio One bounce-only、BOOTH item-specific terms、generated provenance、render / share / bundle / AI permission分離を記録した。実assetは取得していない。
- `docs/design/prototypes/`へ、同一DOM・copy・fake data・interaction logicのHallmark Hum案と独自Pastel Patchboard案を追加した。static gate、主要contrast、Hallmark 58 / 58 gateをpassし、Chrome 150.0.7871.127で2案 x 5 viewportのissue 0、Hallmark案14操作pass、interaction console error 0を確認した。production designは`JUDGE-002`待ちのまま。
- `docs/spec/fake-boundary-and-negative-scenarios.md`へ9 effect port、canonical error、18 negative scenario、deterministic contract、live昇格gateを定義した。`docs/arch/first-vertical-slice-plan.md`はmelody pitch / rhythm、arrangement交換、undo / redo、manual save / reloadだけを許可し、real mic / audio / AI / shareを対象外にした。
- `docs/arch/web-application-stack.md`でfirst fake sliceにTypeScript strict、React 19.2系、Vite、npm lock、Vitest、Playwrightを採用した。local Node v24.14.0が現行Vite minimumを満たすことだけを確認し、dependency installとscaffoldは行っていない。
- `docs/imp/implementation-readiness.md`を`条件付きGO: deterministic fake first vertical sliceのみ`へ更新した。Production visual、real audio、microphone、AI、home server、Cloudflare、実asset、external shareは引き続き保留する。
- `G:\devwork\tool-set`へ汎用のdata contract、media / license、design comparison / browser QA、local AI feasibility / budget template 4件を追加した。開始キットは61件から65件となり、WhatIf 65件、実製本65件、VerifyOnly 65/65 hash一致、assembled file 65、PJ固有語0、secret literal 0を確認した。詳細は同PJの`docs/imp/imp-comp.md`。
- 最終回帰: contract fixture 3 positive / 3 negative、prototype static gate、JavaScript syntax 3 / 3、browser viewport 10件issue 0・interaction failure 0、JSON 14 / 14 parse、Markdown 32件でtrailing whitespace 0・unbalanced fence 0・relative link欠落0、`git diff --check` error 0。
- model追加download、gated terms同意、microphone、speaker、実file出力、実asset、account、secret、Cloudflare resource、external post、deploy、stage、commit、pushは行っていない。

## 2026-07-21 RTX 5080 local generation実測と10GiB VRAM cap

- `nvidia-smi`とprocess実体を照合し、Ollamaにload済みmodelがないことを確認したうえで、Codex以外の確認済みOllama runtime PID 9196 / UI PID 22292だけを停止した。Codex / ChatGPT、browser、Windows UIは停止していない。
- ACE-Step 1.5 source `6d467e4b5081ccb0abf1ec1bf4fdf9051a2d34b0`を`C:\LLM\tools\ACE-Step-1.5`へ取得し、Python 3.12.13、uv 0.11.30、PyTorch 2.7.1+cu128の専用environmentを導入した。PyTorchでRTX 5080 / compute capability 12.0 / `sm_120`と実tensor計算を確認した。
- model revision `19671f406d603126926c1b7e2adc169acbcade22`のmain bundleを`C:\LLM\models\music\ace-step-1.5`へ取得した。57 files、10,092,107,829 bytes / 9.399GiBで、主要4 weightのSHA-256を記録した。
- 10秒・BPM 155・D Major・固定seedのFuture Bass instrumental fixtureを実行した。DiT-onlyは生成1.735秒、peak reserved 7,504MiB、1.7B LM thinkingは8.496秒、14,128MiB。両WAVのduration、48kHz stereo、hash、non-finite 0、near-clipping 0を確認した。
- upstream REST APIのshared checkpoint pre-check差異により1.724GiBの重複未完了downloadが始まったため、該当API PID 45972を停止し、exact pathを確認してduplicate `C:\LLM\tools\ACE-Step-1.5\checkpoints`だけを削除した。正式model bundleは無傷。
- ユーザー追加判断により、1 process peak reserved VRAMを10,240MiB以下のhard capとした。1.7B LM thinkingは成功済みでも不採用・再実行禁止、DiT-only 7,504MiBだけを現在のallowlistとした。
- `scripts/spike_ace_step_generate.py`からLM / thinking起動経路を削除し、初期化後と生成後に10,240MiB capを検査するguardを追加した。AST parse成功、`--thinking`がmodel初期化前にexit 2で拒否されること、ACE-Step process 0件、検証後GPU使用量約1.5GiBを確認した。
- `docs/arch/home-model-serving-topology.md`へ、Access + Tunnel + custom async gateway、single GPU queue、実測allowlist、smartphone fallback、将来のR2 / Queues候補を記録した。Cloudflare resource、domain、secret、router / firewall、deployは変更していない。
- 詳細なversion、hash、latency、VRAM、failureと一次資料は`docs/research/rtx5080-local-music-generation-spike-2026-07-21.md`へ記録した。

## 2026-07-21 Music AI model landscapeと部分採用設計

- ユーザー希望により要件質問を一時停止し、公開modelの有無とfitの一次資料調査を先行した。
- `docs/research/music-ai-model-landscape-2026-07-21.md`へ、humming transcription、full-track / accompaniment、loop / FX、symbolic generation、asset retrieval、timbre transferに関係する14系統を整理した。
- official GitHub、official Hugging Face model card、official licenseを24件linkし、model facts、product fit、推論、未検証を分離した。
- shortlistをBasic Pitch TS、ACE-Step 1.5、Stable Audio 3、MusicGen Melody、CLAP、Magenta.jsとした。採用済みではなくlocal fixture実測待ち。
- SongGeneration 2はofficial licenseがacademic / research / education目的だけを許可しproductionを禁止するため、product非採用・source比較限定とした。
- 1 modelへの全面依存を避け、capability router、optional local model gateway、常設template / rule / asset fallbackをProduct要件、Architecture、tech stackへ同期した。
- Markdown 23件でtrailing whitespace 0、unbalanced fence 0、relative link欠落0、reportのmodel見出し14件、brand state JSON parse成功を確認した。
- model download・実行、dependency導入、外部API、secret、実asset、課金、deploy、stage、commit、pushは行っていない。

## 2026-07-21 AI委任境界と編集性能要件の正規化

- ユーザー回答を`docs/discovery/follow-up-answers.md`へ、回答、解釈、要件signal、未決に分けて保存した。
- AIが曲作りの多くを担うことは許容しつつ、本人のhumming・イメージ指示への追従と、生成後の高い編集可能性をProduct上の必要条件として同期した。
- Product要件へCAP-015とCAP-016、System Context候補へ`Creative Intent Model`を追加した。特定のrepresentation、model、providerは採用済みにしていない。
- Local music AI調査の比較軸へ、入力制約への追従、structured / editable output、部分再生成を追加した。
- 次の質問を、初版で優先する編集対象2つの確認へ進めた。
- Markdown 22件でtrailing whitespace 0、unbalanced fence 0、relative link欠落0、brand state JSON parse成功、必要文書欠落0を確認した。
- model download・実行、外部API接続、依存導入、アプリ実装、stage、commit、pushは行っていない。

## 2026-07-21 コア質問回答の正規化

- ユーザーからコア20問への一括回答を受け、`docs/discovery/core-question-answers.md`へ回答、解釈、未決、follow-upを分離して保存した。
- 17問をcomplete、Q-004・Q-013・Q-019の3問をpartialと判定した。partialは現在の制作停止点、speech command例、audio/project/share formatであり、回答を推測で補完していない。
- personal-first、Web/PWA、instrumental/BGM、humming由来melody、progressive block refinement、smartphone full workflow、manual save、project file、undo/redo、生成・user asset、audio export、X/Misskey shareを要件候補へ反映した。
- Windows native、vocal/lyrics、commercial version、tone/sound自作、autosave、offlineを初版非対象へ移した。
- `PROJECT.md`、`tech-stack.md`、Product要件、System Context、実装開始判定、user判断、design方向、brand module、実装待ちを同期した。
- local music AIとuser asset importは採用済みにせず、license・compute・Web/PWA接続・再配布境界を調べる独立taskへ分けた。model download、実行、外部API、実asset取込みは行っていない。

## 2026-07-21 GitHub remote登録と質問計画の拡張

- ユーザー指定の `https://github.com/rohto4/music-compose-tool.git` をlocal repositoryの`origin`へ登録した。`git ls-remote --symref ... HEAD`はexit 0でadvertised HEAD/refを返さず、`git ls-remote --heads --tags origin`も0件だったため、remoteは現時点でempty repositoryとして扱う。
- fetch対象refがないためmerge、pull、stage、commit、pushは行っていない。
- `docs/discovery/question-backlog.md`へ、設計判断を変えるコア20問と条件付き深掘り最大10問を追加した。一括質問ではなく、回答を保存しながら原則1回に1問進める。
- `PROJECT.md`、`README.md`、docs入口、発見状態、実装待ちへrepositoryと質問計画を同期した。

## 2026-07-21 Phase 0初期化とP0開始テンプレート整備

- 空のworkspaceへ `AGENTS.md`、`PROJECT.md`、`tech-stack.md`、`README.md`、docs入口・管理・進行台帳を追加し、local Git repositoryを`main`で初期化した。remote、stage、commit、pushは行っていない。
- `docs/discovery/project-discovery.md`へ既知要件、仮説、未決、最初の質問を分離した。`docs/spec/product-requirements.md`、`docs/arch/system-context.md`、`docs/imp/implementation-readiness.md`は仮説・候補・保留として作成し、採用済みと表現していない。
- `docs/design/design-directions.md`へHallmark案と独自案「Pastel Patchboard」の比較契約を記録した。prototypeはAudience / Use case / Tone確認後に同条件で作る。
- Hallmarkは公式repositoryを`G:\devwork\clone-dir\Nutlope-hallmark`へread-only参照用に取得し、version 1.1.0、commit `aeb42fb354ff4efa36ab475773a082315a3af2ce`、MIT license、採用・非採用境界を `docs/candi-ref/hallmark-adoption.md`へ記録した。package実行やproject skill installは行っていない。
- `G:\devwork\tool-set\docs\setting\`へ、PJ発見、PJ要件、System Context・Architecture、実装開始判定の汎用template 4件を追加し、開始キットmanifestへ登録した。
- tool-set開始キットは57件から61件へ再製本し、`-WhatIf` 61件、実製本61件、`-VerifyOnly` 61/61件のsource・destination・manifest hash一致を確認した。
- 現在PJはJSON parse、Markdown 19ファイルのtrailing whitespace 0・unbalanced fence 0、相対link欠落0を確認した。汎用template 4件に `music-compose-tool`、対象genre、Hallmark commitのPJ固有値混入がないことを確認した。
- アプリ本体、依存package、実音源、microphone capture、外部API、外部resource、deployは実施していない。
