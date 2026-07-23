# 実装待ち

## FLOW-002: 制作画面を曲・展開・詳細編集の3段へ一本化する

- 状態: 2026-07-24 着手。
- 目的: `ラフ制作 / カスタマイズ`の二重切替を撤去し、`01 曲の設計 → 02 展開を整える → 03 詳細の編集`の順序が一目で分かる単一navigationへする。02には現在のコードパッド・音色・コード進行・音のピースを置き、旧Arrangement専用tabは外して既存DAWを03へ置く。
- 02内の情報設計: 全sectionを縦へ積み、section自体を上へ並べ替える方式から変更する。`PHRASE 01`等の挿入先stripとコード譜はINSERT TARGETとして常時上部へ表示する。その下のINSERT SOURCEだけを`コード・音色 / コードセット / 伴奏 / FX・Fill / 音色割当`の横並びtabで一面ずつ切り替える。コードpadと「コードを鳴らす音色」は同じ面へ置く。Audio Paletteの`ALL`は外し、role別tabだけで高さを抑える。
- コード長UI: 4 / 8は4小節内のコード数であることを明示して横並びにする。各コード長のselectを左右矢印による8分音符単位の伸縮へ置き換え、AUTOが残りを吸収して4小節を維持する。短いstepはコード名をellipsisで省略し、拍数変更でcardを崩さない。
- 設計UI: 01へrequired-stateの小さな完了indicatorを置き、警告modalではなく入力済み状態を点灯で示す。曲の長さ入力は外し、Mood 1 / Mood 2を各10候補のselect、KeyとTempoを選択／入力項目として残す。
- 曲の流れ: `音を組む`末尾のcompactな曲の流れを`曲の設計`末尾へ移す。section追加・長さ・前後移動は保持し、旧詳細ArrangementEditorを別tabとして重複表示しない。
- 02の完成線: Melodyを自動生成しなくても、コード、選択中instrument、Mood、sectionを材料に、特徴的なBass / Arp / Drum / Pad / Synth伴奏を候補から選び、4小節へ一括適用できる。候補は一致理由を短く示し、02までで曲の展開と伴奏の骨格を全曲試聴できる。03は通常の次工程として表示し、`任意`labelは付けない。
- 完了条件: 3 tabだけで設計、Chord Pattern Board、DAWへ移動でき、設計indicator、2つのMood select、Key、Tempo、曲の流れが同じProject commandを更新する。02の横tab、共有挿入先、4小節コード長、伴奏推薦、role別Audio Paletteが同じProject commandへ接続される。shortcutと既存browser journeyを新navigationへ更新し、unit / Chromium / responsive screenshotで確認する。
- 停止条件: Arrangement data、既存Project、Humming Studio、DAW機能を削除しない。入力不足をblockする警告や強制作成順は追加しない。

## ASSET-004: Bass / Lead / Synth / Pad / Arp / Percussionを各20音色へ増強する

- 状態: 2026-07-24 着手。
- 目的: 現状のBass 5 / Lead 10 / Synth 12 / Pad 11 / Arp 11 / Percussion 8を各20へ増やし、Chord Pattern Boardのfamily filterと音のピース棚から選べる物量を揃える。
- 品質要件: familyごとにsub / pluck / reese / acid、mono / saw / bell / brass、keys / stab / mallet、air / dark / choir、pluck / gate / octave、metal / wood / shaker等の用途を分け、layer、waveform、ADSR、filter、stereo、characterを変える。名称差だけの複製にしない。
- 完了条件: 対象6 categoryが各20、全tonal Voice DeckとAudio Paletteへ重複IDなく現れ、全assetに用途説明と音響profileがある。catalog test、audio plan test、全project checkをpassする。
- 停止条件: license未確認sample、外部音源、依存追加、実WAV同梱へ広げない。既存asset IDと既存Project互換性を変更しない。

## HARMONY-001: コードパッドを実用コードquality bankへ拡張する

- 状態: 2026-07-24 着手。
- 目的: 現状14 chordの不足を解消し、key内triadだけでなくPower 5、sus2 / sus4、aug、dim / dim7 / half-diminished、6th、7th、9th、11th、13th、major / minor extensionをHarmonic Atlasから即時発音・配置できるようにする。
- UI要件: 既存のdegree位置と`基本 / 彩り / 意外`属性を保ちつつ、同じdegreeのqualityを縦方向へ関連付ける。全候補を同じ`コード・音色`面から確認でき、名称が長い場合はcard内で崩さない。`LIVE VOICE`は別機能に見えないよう`コードを鳴らす音色`へ改称し、4小節track配置用の`音色割当`と役割を区別する。
- 音響要件: 各symbolはquality固有のintervalを持ち、Chord Pad長押し、HOLD / PULSE / SYNC、配置block、全曲再生、MIDI materializeで同じ構成音を使う。名称だけの候補を追加しない。
- 完了条件: Major / Minorの両keyで実用quality catalogが決定論的・重複IDなしに生成され、Power / aug / dim7 / half-dim7 / 9 / 11 / 13を自動testで確認する。既存pad IDと進行templateの互換性を維持する。
- 停止条件: 全12 root × 理論上可能な全voicingを無制限列挙しない。初版はKawaii Future Bass / Coreの伴奏で選択価値があるqualityに絞り、microtonal、polychord、slash-bass専用voicingは別scopeとする。

## DAW-012: 詳細編集をpiano-roll firstにし、playhead位置から再生する

- 状態: 2026-07-24 着手。
- 目的: `03 詳細の編集`では楽譜を主役として、WQHD 2560×1440の最初のviewport内へpiano rollを常時表示する。MIDI接続状態、音符inspector、Sound Chunk棚を楽譜より上へ常設せず、音符操作はCanvas上のdrag、keyboard shortcut、選択時だけ到達できる操作へ集約する。
- Timeline要件: 小節／拍のrulerをpiano roll直上へ置き、pointerで任意tickへplayheadを移動できる。現在位置をrulerとCanvasの縦線で同期表示し、詳細編集の再生はそのplayheadから全Projectを開始する。停止後も位置を保持し、先頭へ戻す操作を別に持つ。
- Audio要件: WAVへ事前renderしてから再生する方式へ変えず、ProjectのNoteEventとAudioClipをWeb Audioへscheduleする際に開始tickより前をskip／clipする。開始位置をまたぐnote / clipは残り時間だけ鳴らし、終了位置とreceipt durationをProject全長からの残時間に合わせる。
- 完了条件: 不要な常設3面が詳細編集のDOMから外れ、piano rollがWQHD first viewportへ収まる。ruler click、縦playhead、途中tickからのnote / clip再生、先頭戻し、停止をunit / audio plan test / Chromium screenshotで確認する。
- 停止条件: MIDI入力機能、Sound ChunkのProject data・02での挿入、複数音選択、copy / paste、undo / redo、exportを削除しない。再生のための一時WAV生成、外部audio dependency追加、Project schema破壊へ広げない。

## DAW-013: DAW面の常設文章を撤去し、compact controlとguided helpへ分離する

- 状態: 2026-07-24 着手。
- 目的: 詳細編集では文章を読ませず、楽譜、icon、選択色、playhead、短いrole名で操作状態を理解できるようにする。選択件数や操作方法の常設status、説明文、冗長subtitleを撤去し、WQHDの横幅全体を中央piano rollと左右／下部のcompact controlへ使う。
- 構成: 公開されている一般的なDAW構成を参考に、上部transport / tool、中央timeline + editor、周辺track / parameter、下部mixerへ責務を分ける。Studio One固有の画像、icon、trade dressは複製せず、一般的な編集概念と効率的な操作導線だけを採用する。
- Help要件: `?`から開く任意のguided helpを用意し、画面を暗転して現在説明する領域だけをspotlight表示する。短い説明、前へ／次へ／閉じる、keyboard Escapeを持ち、通常編集時のDAW DOMへ長文を常設しない。
- 完了条件: 通常の詳細編集面に説明文・選択statusが常設されず、compact icon controlへaccessible name / tooltipがある。guided helpでtransport、timeline、piano roll、track / mixerを順に案内でき、WQHD first viewportで横幅と楽譜面積が有効利用される。unit / keyboard / screenshotで確認する。
- 停止条件: iconだけにしてaccessible nameを失わない。初回強制tour、外部tutorial asset、Studio Oneの画面画像や固有iconの複製、mobileへdesktopの全controlを強制しない。

## HOME-003: スターターとProject Homeを曲のpreview入口にする

- 状態: 2026-07-24 component実装・型検査・対象test完了。Project Homeの先頭／±30秒／任意位置preview、別曲切替、終了、unmount停止、starter適用前試聴、`.mctproj`専用表示まで追加した。必須実装完了後のWQHD / smartphone browser QA待ち。
- 目的: 既製スターターを選ぶ前と、保存済みProjectを開く前に、その曲がどんな音かを確認できるようにする。情報量の少ないProject cardは再生を主操作にし、BPM、Key、長さ、小節数と曲構造を同じ視野へ置く。
- 操作: 各starterに`聴く / 停止`を追加し、選択中Projectを変更せずdeterministicなpreview ProjectをWeb Audioで鳴らす。Project Homeは再生／停止、先頭、前後30秒、click / keyboardで途中位置を選べるsequence barを持ち、選んだ位置からProjectを再生する。
- 共通化: 詳細編集と同じ`AudioEngine.playProject(project, startTick)`を使い、WAVの事前生成や外部streaming playerを増やさない。別曲の試聴開始時は既存再生を停止し、unmount時にもsourceを停止する。
- 完了条件: starterを適用せず試聴でき、保存済みProject cardを開かず先頭／途中から再生できる。30秒移動をBPMからtickへ換算し、duration、小節表示、active card、終了状態をunit / Chromiumで確認する。
- 停止条件: autoplay、一覧全曲の同時再生、外部音源download、Projectの暗黙変更、previewのための永続保存を行わない。

## START-002: 新規曲の入口を3つの制作経路として再構成する

- 状態: 2026-07-24 要件確定。入口の文言、優先順位、未選択時field非表示、選択後の縦展開、route別field / submit labelはProject Homeへ先行実装しcomponent test済み。Patchboard完成後のAI prompt / Humming route本体は待機する。
- 優先順位: `パッチボードで組む`を現在のprimary implementationとし、蓄積済みのコード、音色、伴奏、FX、DAW、試聴要件を先に閉じる。その後に`AIで土台を作る → 鼻歌でメロディを追加する`、最後に`鼻歌をもとに曲を作る`を作り込む。
- 入口: 横並びの独立機能名ではなく、(1) 手でパッチボードから組む、(2) AIの編集可能な土台へ鼻歌メロディを追加する、(3) 最初の鼻歌をseedに一曲を組む、という3つの制作経路として示す。どの経路も同じProject / Track / Lane / NoteEventと03詳細編集へ合流する。
- 段階表示: 新しい曲を開いた直後は入口選択を主役にし、選択後だけ必要項目を縦方向へ滑らかに展開する。Patchboard / AIは曲名、genre、Mood、Key、BPM、曲の流れ等を扱い、鼻歌先行は録音前に不要な項目を強制せず、推定値または後編集可能な初期値として扱う。
- 完了条件: 初見で3経路の順序と違いが理解でき、未選択時に不要fieldが露出しない。入口ごとに必要fieldとsubmit labelが変わり、既存Project作成、save / reload、surface移動の互換性をunit / Chromium / smartphoneで確認する。
- 停止条件: 入口選択をmandatory data validationの警告modalにしない。Patchboard完成前にAI / microphone実装へ主作業を切り替えない。

## AI-FOUNDATION-002: 選択内容から編集可能なAI土台promptを構成する

- 状態: START-002の第2段階として待機。外部送信・provider接続は別承認gateのまま。
- 目的: `AIで土台を作る`を単一の曖昧な文章欄ではなく、Mood、Key、BPM、section flow、主な音色、コード傾向、Bass / Arp / Drum / Pad等の伴奏密度を選ぶ画面にし、その選択から十分に具体的なinstrumental promptと構造化requestを決定論的に生成する。
- 透明性: 実行前に「AIへ渡す内容」をdisclosureで確認・copyできる。内部requestには`Instrumental only / no vocals / no lyrics / no spoken words`、編集可能なtrack分離、section単位の要求を常に含め、選択値と生成promptが一致する。
- 結果: local rule / fake routeでもChord、Bass、Drum、Pad、Arp、sectionを別laneのsymbolic foundationとして作り、03で編集できる。将来providerを接続する場合もflat audioだけをProject正本にしない。
- 完了条件: 選択変更でprompt / JSON previewが決定論的に更新され、作成commandへ同じ条件が渡る。成功、provider unavailable、malformed response、partial trackのfallbackをtestし、外部送信なしでもrule foundationを完成できる。
- 停止条件: secret、外部API、home server job、課金、network送信を暗黙に有効化しない。PatchboardのUI・Project dataを別実装で複製しない。

## INTEROP-001: Studio OneとのProject交換境界を明文化する

- 状態: 2026-07-24 公式資料調査中。実装はStandard MIDI / WAVの現行線を維持し、`.dawproject`を将来候補として分離する。
- 目的: Studio One native `.song`を直接読み込めるか、Standard MIDI Type 1、WAV / stems、DAWprojectのどこまでを安全に交換できるかを一次資料と公開specで確認する。
- 判断線: proprietaryな`.song` parserを推測実装しない。現行は`.mctproj`をアプリ内の完全保存形式、Standard MIDI Type 1とWAV / stemsをStudio One handoffとする。openな`.dawproject`はnote、audio、tempo、marker、mixer等の共通部分を対象に別unitでimport / exportを検討し、plugin stateや未対応featureは警告付きで欠落を可視化する。
- 完了条件: 公式資料link、formatごとの交換可能data、欠落data、license / plugin境界、推奨実装順をresearch documentへ残し、Project Homeの`読み込む`が現時点では`.mctproj`専用であることを誤認なく表示する。
- 停止条件: `.song`互換を未検証のまま謳わない。Studio One installation、commercial plugin、third-party converter、外部uploadを要求しない。

## SHORTCUT-002: 設定画面のキー表記と入力解除を読みやすくする

- 状態: 2026-07-24 実装・型検査・対象test完了。canonical値とlocalStorage schemaを維持したまま、矢印glyph、space付き` + `、未設定、conflict / browser予約errorを同じdisplay formatterへ統一し、同button再click / Escapeでcaptureを中止できる。
- 表示: 内部保存と照合に使う`ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight`は変更せず、設定画面では`↑` / `↓` / `←` / `→`として表示する。複合keyは`Ctrl + S`、`Shift + ↑`のように`+`前後へ半角spaceを入れる。error / conflict表示にも同じformatterを使う。
- 入力解除: `キーを入力…`状態の同じ割当buttonを再度clickしたらcaptureを中止し、元の割当表示へ戻す。Escapeでも中止できる既存挙動を保持し、capture中のclick自体を新shortcutとして誤取得しない。
- 完了条件: default、変更済み、未設定、conflict、browser予約shortcutの全表示が同じformatになる。同button再clickとEscapeでcapture解除でき、解除・初期値・保存を壊さないunit / component testを追加する。
- 停止条件: shortcut canonical string、localStorage schema、既存keyboard command matchingを表示改善のために変更しない。

## DES-006: 1行見出しと制作優先の情報密度へ全画面を整理する

- 状態: 2026-07-23 主要surfaceへtitleless-ready構造を実装し、WQHD～375pxと1648px CustomizeをAI visual確認済み。表示titleを外しても役割が自明な箇所を増やす品質反復と、★3ユーザーレビューを継続する。
- 目的: `英字eyebrow + 大見出し + サブタイトル + 説明`を機械的に積む癖をやめ、制作領域を広く使う。原則は大きめの主見出しを左、必要な補足だけ同じ行の右へ置き、補足が操作判断へ寄与しない場合は表示しない。
- 削除要件: `Chords / chord`、`Drums / drum`等の同義反復、QUICK START等の飾り文、`迷ったらここから`等の一般説明、機能名を言い換えただけのsubtitleを削る。状態、失敗、現在値、操作結果等の必要情報は消さない。
- Section造形: 見出しだけの矩形cardと機能cardを同じ罫線・背景で並べない。見出しは余白、rule、片側accent、typographyでsectionの開始を示し、直下の機能surfaceと一組だと読める構造へする。次sectionとの間には明確な呼吸を置く。
- 最終到達点: 見出しは情報構造が未成熟な間の足場として扱う。配置、接続、現在値、操作結果だけで役割が自明になったsectionは、accessible nameを保持したまま表示見出し自体も段階的に外し、制作面をさらに広くする。
- 根拠表示: コード進行等の調査出典は各操作cardから外し、section末尾の小さな`出典・設計根拠`disclosureへ集約する。制作時に意識不要な技術説明を主要視線へ入れない。
- Copy要件: コード進行は理論事実の説明より、響き、感情、使いどころ、展開上の役割を短く示す。degreeやsymbolは編集に必要なdataとして残しても、専門語の解説文を主copyにしない。
- 完了条件: 曲の設計、コード進行、Chord Score、role pattern、音色、展開、カスタマイズの主要見出しとcardを棚卸しし、冗長文削減、section境界、WQHD / 1648 / mobile overflow、accessible nameをbrowser screenshotで確認する。最終copyの好みは★3でユーザーレビューを待つ。
- 停止条件: 必須status、error、license attribution、accessibility labelを見た目簡略化のために削除しない。

## STARTER-001: 再利用可能な既製曲から始める編集スターター

- 状態: 2026-07-23に個別license確認済みの6 studyをlocal実装・AI自律確認。通常編集・key / BPM / section変更・DAW再生へ接続済み。曲データの正確さと使い勝手は★3ユーザーレビュー待ちで、さらに異なる構成型を追加する品質拡張だけを継続する。
- 目的: 白紙だけでなく、既存曲の構成、コード、旋律をMIDI譜面として見て、そこから音色、section、コード、音符を変更できる`曲から始める`sectionを曲の設計へ追加する。
- 権利境界: 最初はpublic domainの作曲物、またはscore / MIDI sourceに明示的な再配布・改変許諾がある素材だけを採用する。録音物の権利と作曲物の権利を分け、曖昧な商用sample、streaming音源、第三者arrangementは同梱しない。出典URL、作者、source license、編曲／データ化主体、変更可否をpresetごとに記録する。
- データ要件: Starterは専用audioを正本にせず、Project / Track / Lane / NoteEvent / MusicBlock / ArrangementSectionへ決定論的に展開する。アプリ内音色で試聴し、Melody / Chords / Bass / Drum等を通常DAWで編集、key / BPM / section変更、undo / redo、save / exportできること。
- UI要件: `曲の設計`に`既製曲から始める`sectionを置き、曲名、作曲者、年代／public-domain根拠、section列、BPM / key、長さ、難易度、含むtrack、出典／licenseを比較する。適用前に現在Projectを置換する範囲を明示し、ユーザー編集を黙って消さない。
- 量の要件: licenseとデータ品質を確認できたものを複数ジャンル／構成型へ広げる。件数だけを優先せず、各presetが実際に異なるsection構成・和声・旋律の学習材料になること。
- 完了条件: catalog、license manifest、少なくとも複数presetのProject変換、試聴、通常編集、key / BPM / section変更、save / reload、MIDI / Brief出力をunit / Chromiumで確認する。元曲の正確さと編集体験は★3でユーザーレビューを待つ。
- 停止条件: license不明、attribution / share-alike条件を満たせない、録音権が不明、外部accountや利用規約同意、secret、課金、public deployが必要な素材は取り込まない。

## PIVOT-001: 3入口から編集可能MIDIへ合流するpattern制作基盤

- 状態: AI Starter、60 tonal Voice Deck / 136音bank、全14コードHarmonic Atlas、9進行template、6伴奏phrase kit、全曲key変更、無制限4小節phrase、8分音符AUTO配分、長押しsustain、ABC / Creative Brief / JSON / project file、42 role pattern、多層6曲starter、24 Sound Chunk、shortcut設定、responsive DAW、88鍵wheel-scroll DAWまでlocal実装・自動proof済み。次はユーザーの実耳・実操作による★4ブラッシュアップ。Humming Studioは削除せず品質改善を保留し、既存DAW詳細編集は採用継続・ユーザーレビュー待ちとする。
- 背景: 実操作では鼻歌開始の生成品質の振れ幅が大きく、現状は制作の基盤として使いにくい。一方、1小節単位の決定論的pattern、即時試聴できる大きなchord pad、instrument切替、進行の組み立て、Studio Oneへ渡せるMIDI / audioは、最初の一歩を安定して支援できる見込みがある。
- 目的: `AI Starter`、手動`Pattern Board`、experimental `Humming Studio`の3入口を用意し、どこから始めても同じProject / Track / Lane / NoteEventへ合流して、1小節patternの差替え、MIDI譜面の手編集、Studio One handoffへ滑らかに進める制作基盤を作る。
- 最低要件: chord padは鍵盤の代替表示ではなく、選択中のchord用instrument / timbreで、padを押したその場で和音を鳴らす。配置済みpatternの再生だけを試聴経路にしない。
- 音色要件: Future Bass / Coreの前面へ出る尖ったsaw / pluck系と、奥行き・補強を担うsoft pad / sub等を多数の役割別bankとして用意し、各instrumentの特色に合う1小節pattern候補を用意する。単一oscillatorの名称差や少数presetだけを音色library完成とみなさない。
- Harmonic Atlas再設計: Chord Padで使える音色を9から60へ増やした。既存Audio Paletteと別の音を複製せず、136音中の60 tonal profileをChord / Synth / Pad / Lead / Arp / Bass familyから選んで、その場で和音として鳴らせるようにする。現在音色、family、総数が1画面のスクリーンショットでも判別できること。
- コード配置再設計: `基本 / 彩り / 意外`を排他的tabにせず属性labelとして残し、全14候補を同時に1 tap可能にする。基本7コードをdegree順に主軸へ並べ、彩りと借用・外側コードを関連degreeの近くへ置く関係図として表現する。
- 拍数要件: 4 / 8は小節数ではなくprogression step数として扱い、各stepを1〜4拍から指定できるようにする。後続stepのstart tick、loop終端、Web Audio、MIDI、save / reloadへ累積拍数を反映し、1拍＋3拍のような連続進行を作れること。
- 4小節phrase拍数修正: 4 / 8は1 phrase内のコード数だけを表し、各phraseを常に16拍＝4小節とする。1つのSTEP拍数を変更したら残りSTEPを8分音符単位で自動配分し、付点4分音符を選べるようにする。各phraseの合計、全曲loop終端、block start / duration、Web Audio、MIDIを一致させ、自動調整されたSTEPを画面上で判別できること。三連符はこのsurfaceに含めない。
- 複数phrase拡張（2026-07-23更新）: 4小節は曲全体の上限ではなく追加単位とする。4小節phraseを上限なしで追加でき、desktopは最大8小節を横一列、その先を次の譜面行へ送る。各4小節phrase内だけで拍数を自動配分し、全曲のblock start / durationとloop終端はphrase連結から算出する。
- コード譜出力: 全phraseを小節線、コードsymbol、各コードの長さが分かるテキスト譜へ変換し、AI promptへ貼れる説明付きtextと、既存の共通テキスト譜面形式の両方をcopy / downloadできるようにする。共通形式は一次資料を調査し、8分音符単位・付点4分・4/4・bar境界を欠落させない方式を採用する。
- Creative Brief / prompt出力（2026-07-23更新）: コード進行だけでなく、曲の設計、ムード、BPM / key、主線・Lead、使用音色、音のピース、section構成、コード譜を同じ設計書へ段階的に集約する。各surfaceは担当部分のprompt断片を確認・出力でき、全体は外部生成アプリ向けMarkdown、local AI向け構造化JSON、既存Project bundleとしてfile downloadできること。browser保存だけを安全性の唯一の経路にしない。
- Instrumental制約（2026-07-23更新）: Creative Briefと生成向けpromptは一貫して`Instrumental only`、歌詞なし、歌声なしを明示し、主線はvocalではなくLead / Melody instrumentとして記述する。外部生成アプリではInstrumental modeを選ぶ前提を表示し、local AIへはlyrics / vocal生成を禁止する制約として渡す。
- Header再設計: 横幅を占有するPatchboard / Humming Studioの全幅buttonを廃止し、左上の丸い2 controlへまとめる。active / inactiveは色だけでなく形、marker、`aria-current`、tooltip / accessible nameで判別できること。
- 全画面適用思想: 情報をtabで隠して単純化するのではなく、全体像を表示したまま位置、形、濃淡、階層で理解できるようにする。現在値、次の操作、結果の3点を同じ視野へ置き、spaceを消費する説明や全幅controlを減らす。この原則をChord PadだけでなくHeader、workspace、asset、editor共通へ適用する。
- Dark Pastel要件: 真黒に近い背景の威圧感を下げ、青紫・藤・青緑を低彩度で含むdark pastel surfaceへ変更する。編集面のcontrastとyellow操作色は維持し、panelごとの僅かな色相差で階層を作る。
- AI Starter要件: 生成結果をflat audioだけにせず、Chord / Bass / Drum / Pad / Arp等の編集可能なsymbolic foundationとして作る。local Home AIが使えない場合はTemplate Harmonizerへ明示fallbackし、実際に使ったengineをUIへ表示する。1小節だけpadで差し替えた場合、未編集の生成小節を消さない。
- 編集合流要件: 3入口のどこからでも60分DAW詳細編集とStandard MIDIへ進める。pattern blockは再生・export時にNoteEventへ決定論的にmaterializeし、詳細編集へ展開した後はmanual NoteEventを正本にする。
- 操作feedback要件: hover、keyboard focus、pointer drag、drop候補、選択中を色だけでなく浮き上がり、outline、shadow、cursor、明示labelで区別し、今つかんでいる要素と移動先を常に判別できるようにする。`prefers-reduced-motion`では移動animationを抑える。
- 品質要件: chord padは成熟した既存カテゴリであるため、単に動作するMVPを完成扱いしない。競合比較の8品質軸で評価し、発見性、即時発音、voice-leading、pattern、timbre、編集 / 保存、DAW handoff、touch / accessibilityの全てを最低3、primary軸を4以上へ上げ、ユーザーの実操作ブラッシュアップ後だけ完成扱いする。
- 完了条件: 現行Project / Track / Lane / Note / Audio Engine / MIDI-WAV exportの再利用境界、AI Starter、pattern data contract、60 tonal voice deck、全候補Harmonic Atlas、4小節phrase追加、8分音符単位の拍数配分、8小節ごとの譜面行、ABCコード譜、全曲Creative Brief / JSON / Project file出力、compact surface switcher、3入口のDAW / MIDI合流、hover / drag feedback、受入journey、競合benchmark、機能別進捗マトリクスの再編について実装と検証証拠が記録される。UI / 音楽品質の最終完成判断はユーザーの★4レビュー後とする。
- 停止条件: Humming / ACE機能の削除、既存Project互換性の破壊、license未確認音源の追加、Studio One固有assetの直接利用、外部credential / deployが必要になる境界では停止する。
- 現時点の非目標: Humming / ACE生成品質の再改善、license未確認の実音源pack導入、Studio Oneとの専用plugin連携。AI Starterのlocal first sliceは編集可能なrule foundationを常設fallbackとし、Home AIによる高度化はcapability境界の後段とする。
- 保持境界: 既存の60分DAW詳細編集画面は、Pattern Boardで作った下書きを音符・長さ・timing・velocity・mixまで詰める後段surfaceとして保持する。ユーザーが外観・操作をまだ十分レビューしていないため、UI / 操作は★3のままにし、置換・削除・★4以上への更新をしない。

## MOB-004: スマホをChord Score Composerとして完成させる

- 状態: 2026-07-23 local実装／AI自律確認済み・★3ユーザーレビュー待ち。375×812の縦譜、14 chord、44px pad、横overflow 0、長押し／cancel、PromptをChromiumで確認済み。
- Product境界: smartphoneはdesktop DAWの全機能再現を要求しない。ラフ制作、選択音色のChord Pad、4小節phraseの追加・長さ編集、縦型コード譜、試聴、Instrumental Promptのcopy / file共有をprimaryにする。
- 譜面UI: smartphoneでは4小節phraseを1段として縦へ積み、初期状態で4段＝16小節を確認できる構成にする。phraseは上限なく下へ追加でき、document横overflowを出さず縦scrollで読む。各段に小節番号、コード記号、コード長、AUTO調整を残す。
- 演奏UI: Chord Padは`pointerdown`で現在音色の和音を開始し、押している間はsustainし、`pointerup` / `pointercancel` / `lostpointercapture`でreleaseする。tap配置は維持し、長押し時も誤った多重配置やstuck noteを起こさない。keyboard操作は既存の有限auditionへfallbackする。
- Prompt handoff: smartphoneから現在のコード譜とCreative BriefをClipboardへcopyし、Suno等の外部アプリへ貼り付けられるようにする。常にInstrumental modeをONにする案内と`no vocals / no lyrics`制約を含める。
- Start画面: smartphone幅では`AI Starter` / `Pattern Board`のラフ制作を優先し、精密DAWの全操作を保証しないことを明示してよい。既存Project、Humming、desktopカスタマイズ機能を削除せず、利用可能なsurfaceだけを狭い画面へ優先表示する。
- 完了条件: 375×812pxで4段の譜面構造、phrase追加、押下sustain / release、拍数変更、Prompt copy、縦scroll、横overflow 0、pointer cancel時停止をunit / Chromium mobile E2E / screenshotで確認する。
- 停止条件: mobile browserのAudioContext / Clipboard制約でuser gestureが必要な場合は偽装せず案内する。実Suno投稿や外部app自動操作、public deployは行わない。

## DES-005: 現行layoutを保つ3テーマとWQHD視覚品質反復

- 状態: 2026-07-23 local実装／AI自律確認済み・★3ユーザーレビュー待ち。3 themeの切替／reload復元とWQHD～375pxの同一layoutをscreenshot / metricsで確認済み。
- Layout境界: 現在のbutton配置、情報構造、Harmonic Atlas、譜面、workspace構成を変更対象にしない。テーマはtoken、surface色、role色、accent、濃淡、contrastだけを切り替える。
- Theme 1 `Dark Pastel Studio`: 現行の青紫・藤・青緑を含むdark pastel。精密編集の集中感を保ち、純黒の威圧感は避ける。
- Theme 2 `Vanilla Pastel`: 初期Pastel Patchboardのvanilla色をbaseに、薄いpink / lavender / mint / skyを音楽dataへ割り当てるlight theme。文字・境界・focusのWCAG AA contrastを崩さない。
- Theme 3 `Friendly Signal`: 視認性重視。Chord / Melody / Bass / Drum / Pad等の機能roleを区別しやすい色へ分け、操作可能control、成功、警告、失敗も色だけでなくoutline / labelと併用する。
- 切替要件: workspace上部のcompact theme selectorから3 themeを即時切替し、`localStorage`へ端末単位で保存する。Project fileの音楽dataへthemeを混ぜない。初期値は現行`Dark Pastel Studio`。
- Accessibility: `color-scheme`、focus-visible、disabled、selected、hover、drag、AUTO、hold中を各themeで確認し、色覚だけへ依存しない。Canvas piano-rollもtheme tokenを参照するが、note role色と編集状態を保持する。
- WQHD品質反復: 2560×1440を主viewportに、1920×1080、1440×900、768px、375×812も観測する。Home、ラフ設計、4段コード譜、Harmonic Atlas、section、カスタマイズDAW、Prompt panelをscreenshotし、clipping、overlap、horizontal overflow、読めないcontrast、操作状態の欠落を直す。console / request failure / accessibilityも同時確認する。
- 完了条件: 3 themeを切替・再読込復元でき、同じlayoutと操作が維持され、各themeのWQHD screenshot、主要breakpointのmetrics、Vitest / Playwright / browser QAを証拠化する。ユーザーの最終色味判断は★3の後に待つ。
- 停止条件: font / image / audio等の外部asset追加、public deploy、既存layout全面変更が必要になる場合は停止する。

## DAW-006: ラフ／カスタマイズの二段制作とDAW操作ハードニング

- 状態: 2026-07-23一次資料調査、local実装、AI自律確認済み・★3ユーザーレビュー待ち。ラフ／カスタマイズ、section保持、矩形選択、Shift追加、複数note atomic move、ghost / delta、undoをunit / Chromiumで確認済み。
- 背景: 現行の10分ラフ／30分整形／60分仕上げは、30分整形の役割と存在意義が画面から伝わりにくい。一方、音素材と構成を短時間で組む段階と、選択したMIDIを精密編集する段階は操作粒度が明確に異なる。
- 採用仮説: surfaceを`ラフ制作`と`カスタマイズ`の2 modeへ統合する。ラフ制作は曲の設計、コード、音色、section構成、試聴、Creative Briefを扱う。カスタマイズは既存60分DAWを保持・拡張し、note、timing、length、velocity、track / mixer等の精密編集を担う。
- 根拠境界: Ableton公式Learning Musicのbeat / bassline / chord / melody / song structureの段階学習、Live公式manualのselection-based editing、Logic Pro公式manualのArrangement Markerによるsection単位編集を比較し、特定DAWの内部実装を推測しない。
- Section保持: Intro / Verse / Build / Drop / Break / Bridge / Outro等をsectionとして追加・並べ替えられる現在の機能は削除しない。一般DAWにもArrangement Marker相当はあるが、Patchtoneでは初心者が曲構成を直接扱う主要価値としてラフmodeに常設する。
- DAW追加要件: 空白dragによる矩形範囲選択、Shift追加選択、複数noteの一括pitch / timing移動、drag中のghost / delta表示、snap、keyboard代替、undo / redoを実装する。既存single note move / resize、inspector、section、Canvas viewport cullingを壊さない。
- UI品質: 1920×1080、1440×900、768px、375pxでheader、toolbar、inspector、Canvas、mixerのclipping / overflow / 重なりを観測し、崩れを証拠付きで修正する。動きは`prefers-reduced-motion`で静的outline / ghostへ縮退する。
- 完了条件: 二modeの名称と責務がUI・要件・Architectureへ同期され、ラフからコード譜／Creative Brief、カスタマイズから複数noteの選択・移動・保存・MIDIへ進むjourneyをunit / E2E / browserで確認する。既存60分DAWの★3レビュー待ち境界は維持する。
- 停止条件: 既存Project schema破壊、section編集削除、未確認plugin / proprietary DAW asset導入、外部deployが必要になる場合は停止する。

## APP-002: Phase 1 completion hardening

- 状態: Goal active。前回のvertical sliceから、未完了の実要求を実装・検証する。鼻歌source audioとvoice/reference audioのACE-Step条件付き経路まで追加済み。
- 目的: DAW note length resize / automation / FX、MIDI入力のnote duration、WAV/stem/MIDI parse proof、ACE-Step追加layer artifact適用、SNS share adapter、PWA browser QAを完成線へ近づける。
- 完成条件: UI上の操作がdomain state・再生・保存・exportへ一貫して反映され、fake/local boundaryで再現可能なテストがある。外部資格情報・実投稿・実ACE artifactのみ別external gateとして明示する。
- 停止条件: 10,240MiB cap超過、秘密情報/外部アカウント/公開resource作成、license未確認素材の再配布、対象不明process停止。
- 分割: `P1-DAW` note editor、`P1-MIX` automation/FX、`P1-EXP` parser/stem、`P1-MIDI` note duration、`P1-AI` artifact layer、`P1-SHR` intent adapter、`P1-PWA` runtime QA。
- 完了記録（/root/daw_hardening）: P1-DAW/P1-MIXのノート右端length resize、複数選択操作のatomic history、filter/reverb/delay/sidechainとautomation pointsの実操作を実装・検証し、主要source・test・残課題を`imp-comp.md`へ転記済み。実機MIDIはexternal gateとして残す。

## APP-001: Pastel Patchboard production Web / PWA実装

- 状態: Goal active。`P1-FND`〜`P1-QA`のlocal実装とfake/Chromium primary proofをverified（local score 100/100）。PWA QAではapp自動登録呼び出しとscope/cacheを実測済み。実MIDI機器、Misskey実instance、X OAuth、PWA install promptはexternal gateとして残す。進捗正本は`phase1-progress.md`
- 目的: 現在のPastel Patchboard UIで提示している操作をfakeではなく実動作へ置き換え、実際に曲を作成、編集、保存、再読込、書き出しできるlocal Web / PWAにする。
- 完成線: 複数project作成、音のピースの1 tap試聴と配置、展開編集、microphone鼻歌録音、pitch / rhythm音符化、鼻歌をseedにしたAI伴奏生成、DAW-like編集、undo / redo、manual save / reload、WAV / MIDI export、および現行UI上で操作可能に見える機能の実動作。
- Surface追加: Project Homeから、manual-firstの`Patchboard Workbench`と、鼻歌を最初に入力して一曲候補を生成・自然言語refineする別pageの`Humming Studio`へ進める。両者はproject / audio / editor基盤を共有する。
- 明示許可: microphoneとlocal AIの実行。既存の1 process peak reserved VRAM 10,240MiB hard capを維持する。
- 対象外: Cloudflare経由のWeb app外部公開とpublic deploy。X / Misskeyのactual post adapterとlive gateは対象へ追加。
- 鼻歌伴奏の決定: 鼻歌由来melodyのpitch / rhythmは極力維持し、AIにはchord、bass、drums、synth、展開等の周辺伴奏を作らせる。本人のmelodyだと分かることを優先する。

- 現在の確認点: sound source、AI生成物の編集粒度、録音単位、export、manual save、曲規模、track / mixer、mobile、実runtimeの詳細条件。
- 停止条件: 10,240MiB VRAM cap超過、利用規約への新規同意、secret・account・public resource作成、外部公開、対象不明のprocess停止、license未確認assetの再配布が必要になった場合は、その境界だけ停止して他のlocal実装を継続する。
- Blueprint: `docs/imp/phase1-blueprint.md`
- 星取り表: `docs/imp/phase1-progress.md`、人間向け`docs/imp/phase1-progress.html`

## DISC-001: 要件発見インタビュー

- 状態: コア回答反映済み・AI feasibility調査を先行するため一時停止
- 目的: 最短の質問から開始し、回答に応じて必要な詳細質問だけを選ぶ。
- 完了条件: 利用者、課題、最初の成功、主要workflow、非目標、成功指標、制約、未知が整理され、`docs/spec/product-requirements.md` の仮説が回答または未決に変換される。
- 現在module: Purpose / Why
- 質問計画: コア20問は17 complete・3 partial。条件付き深掘り最大10問のうち、`F-004 Probe 2b`で一時停止。
- 質問規律: 原則1回に1問。回答後に短く言い換え、必要なら1回だけ深掘りする。
- 再開点: melody pitch / rhythmを中心とするDAW-like P0操作はprototypeで仮優先済み。次は実際に操作した所感からP1（複数選択・copy / paste・範囲loop等）の順序を見直す。

## SPIKE-001: Shortlist modelのlocal feasibility実測

- 状態: ACE-Step 1.5のWindows / RTX 5080 fixture完了・他shortlist継続待ち
- 目的: Basic Pitch TS、ACE-Step 1.5、Stable Audio 3、MusicGen Melody、CLAPを、同一fixtureとfailure条件で実測し、採用・保留・非採用を決める。
- 今回の実行範囲: 現在PCのRTX 5080、disk、runtimeを棚卸しし、Codexを除く明確なAI model runtimeをPID単位で停止した後、ACE-Step 1.5の約10GB core取得と短いinstrumental fixtureのWindows local generationを検証する。
- 最初の候補: ACE-Step 1.5のWindows local generation。Basic Pitch TSはbrowser実装開始後の別fixture、Stable Audio 3はmodel利用条件への同意が必要なため別gateにする。
- 完了条件: model / dependency version、download size、disk、RAM / VRAM、latency、humming / prompt追従、structured output、partial edit、unsupported / timeout / failure fallbackを記録する。
- 完了済み範囲: core 9.399GiB取得、CUDA `sm_120`確認、DiT-only / 1.7B LM thinkingの10秒instrumental生成、latency / VRAM / hash / audio health記録。`docs/research/rtx5080-local-music-generation-spike-2026-07-21.md`。
- 追加constraint: peak reserved VRAM 10,240MiB / processをhard capとする。DiT-only 7,504MiBだけを許可し、1.7B LM thinking 14,128MiBは起動禁止。
- 残り: 人によるgenre fit試聴、humming fixture、reference / repaint、長尺、Basic Pitch TS、Stable Audio 3、MusicGen Melody、CLAPの採否。
- 今回の承認: dependency install、ACE-Step 1.5のmodel download、約10GB級disk使用、GPU実行、Codex以外の確認済みAI model process停止。停止対象が曖昧なprocessは終了しない。
- 停止条件: secret、外部API、課金、Cloudflare resource作成、router / firewall変更、deploy、gated modelの利用条件同意は対象外。これらが必要になった時点で停止する。

## ARCH-001: Home RTX 5080 model servingとPWA中継設計

- 状態: Candidate Architecture記録済み・live構築未承認
- 目的: 自宅RTX 5080をheavy music generation serverとし、Web / PWAから安全にjobを投入できる境界と、model同時常駐または切替方式を決める。
- 採用済みProduct境界: smartphoneではheavy generationを必須にせず、生成済み候補の編集とtemplate / rule / assetによる非AI workflowを保証する。
- 完了条件: PWA、Cloudflare等のfront door、home inference API、job queue、model manager、artifact受渡し、認証・timeout・failure fallbackを図示し、RTX 5080実測に基づくresident / on-demand方針を記録する。
- 設計成果: `docs/arch/home-model-serving-topology.md`。Stage AはAccess + Tunnel + local async queue、Stage B候補はWorker + private R2 + Queues pull consumer。
- 非対象: Cloudflare account / Tunnel / Worker / R2等の作成、domain変更、port forward、router / firewall変更、public deploy、secret登録。

## ASSET-001: User asset importとlicense境界

- 状態: Candidate contract・一次資料調査・fixture作成済み。実assetとbrowser matrix待ち
- 目的: 生成asset、BOOTH等のuser asset、Studio One等のuser-owned DAW資産を、安全にprojectへ取り込む契約を定義する。
- 完了条件: supported format、DAWからのexport/import可否、metadata、license記録、validation、project同梱、再配布、share、missing asset、malformed fileの扱いが決まる。
- 完了済み範囲: WAV PCM canonical候補、browser capture / render / save境界、Studio One bounce-only、BOOTH item-specific terms、生成asset provenance、render / public share / bundle / AI processing分離、schemaとpositive / negative fixture。
- 残り: 実際のStudio One version / content EULA、対象BOOTH商品規約、browser matrix、実audio decode、MIDI import、userによるpolicy確認UI。
- 非対象: 実assetのdownload・upload・再配布。
