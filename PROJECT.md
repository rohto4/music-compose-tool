# Music Compose Tool Project Context

## 目的

DTMのように一音ずつ入力しなくても、まとまった音のセットをクリック中心でパズルのように組み合わせ、少量のボイス入力も使いながら短時間で曲を作れるツールを提供する。

## 現在の対象

- 最初のジャンルは「かわいいFuture Bass」と「かわいいFuture Core」。
- PCではクリック中心、スマートフォンではタッチ中心で操作できることを目指す。
- ドラム、FX、和音、シンセ等の音セットを切り替え、まとまり単位で配置・交換できる体験を中心にする。
- 音のピースはコード、ドラム、ベース、リード、シンセ、パッド、アルペジオ、パーカッション、FX、transition等へ広げる。
- 制作surfaceは、`01 曲の設計`、`02 展開を整える`、`03 詳細の編集`の3段に一本化する。02はコード・音色・4小節素材、03は既存DAW-like editorの音符・mixを担当する。
- 最初の配布surfaceはWeb / PWAとし、smartphoneでも新規作成、途中編集、試聴、共有を行えるようにする。
- vocal / lyricsではなくinstrumental / BGMを対象にする。
- 本人のhummingをmelodyのseedにし、理論知識を補うchord・asset推薦、伴奏、加工、FX候補へつなげる。
- 生成assetとuser uploadを扱い、manual save、project file、undo / redo、audio exportを提供する。

## 現在のPhase

`Phase 1: local production implementation / pattern-first refocus`

Phase 0で要件、data contract、System Context、local model feasibility、Pastel Patchboardの操作prototypeを整え、local Web / PWAの実装を一巡した。2026-07-22の実使用ではHumming Studioの生成品質の振れ幅が大きく、制作基盤として未達と判断した。Phase 1のprimary完成線を、選択中の音色で即時発音するchord padと1小節patternを組み、Standard MIDI / WAVでStudio Oneへ渡せるpattern-first workflowへ移す。Humming / ACEは削除せずexperimental secondary surfaceとして保留する。X / Misskey等の資格情報が必要なlive確認は別gate、Cloudflare公開とpublic deployは対象外とする。

## Repository

- remote: `https://github.com/rohto4/music-compose-tool.git`
- local branch: `main`
- remote状態: 2026-07-24にbaselineとPhase 1機能unitを`main`へpush済み。このsessionも機能単位でcommit / pushしている。

## 正本

- 実行・安全・復帰ルール: `AGENTS.md`
- 恒久目的とscope: `PROJECT.md`
- 採用済み・候補・未決技術: `tech-stack.md`
- 文書入口: `docs/README.md`
- 発見セッション: `docs/discovery/project-discovery.md`
- 質問候補と進行: `docs/discovery/question-backlog.md`
- Product要件: `docs/spec/product-requirements.md`
- System Context: `docs/arch/system-context.md`
- デザイン比較: `docs/design/design-directions.md`
- ユーザー判断: `docs/imp/user-judge.md`
- 実装待ち: `docs/imp/imp-tasks.md`
- 完了証拠: `docs/imp/imp-comp.md`

## 恒久方針

- 「速く曲を作れること」を機能数より優先し、最初の反復作業を短くする。
- 画面の最初のviewportに実際の作曲workbenchを置き、一般的なmarketing heroで隠さない。
- テンプレートは完成曲ではなく、交換・組み換え可能な音楽ブロックとして扱う。
- 音楽理論やDAW操作を知らない利用者でも開始でき、詳しい利用者には必要な範囲だけ調整余地を開く。
- 制作初期は大きなblock、洗練段階では細かなblockとし、同じprojectを段階的に深く編集できるようにする。
- BPM、key、chord、tone、mix等は初期画面へ一度に露出しなくても、必要に応じて到達・変更できるようにする。
- AIは曲作りの多くを担ってよいが、本人のhummingとイメージ指示を生成結果へ反映し、本人が重要箇所を深く編集できる形で自作感を守る。
- 深い手編集はmelodyのpitch / rhythmを最優先にする。chordは直接編集を必須にせず、自動生成・候補選択・asset差し替えを中心にする。
- 曲構成は初期flowを候補から選び、流れや展開を交換できるarrangement assetとして扱う。
- instrumentは豊富な音源候補を必要とするが、生成・user-owned asset・Studio One製品資産の利用可否はformatとlicense確認後に決める。
- Music AIは1つのmodelへ全面依存せず、humming transcription、full draft / accompaniment、loop / FX、asset retrieval等のcapability単位で、適合するmodelだけを部分採用する。
- heavy music generationはユーザー管理のhome RTX 5080 serverで実行し、Web / PWAから安全なjobとして利用するProduct topologyを採用する。Cloudflare等の中継実装は別途検証して決める。
- home inferenceが他作業を圧迫しないよう、1 processのpeak reserved VRAMは10,240MiB以下をhard capとする。実測がないprofileと上限超過profileは起動しない。
- LLM runtime / model storageはGドライブ側へアクセスできない場合、Cドライブの専用領域`C:\LLM\...`を作成・利用してよい。Cドライブ直下や既存領域へ無差別に書き込まず、tool、model、cache、outputを用途別directoryへ分離する。
- smartphoneではheavy generationを必須にせず、server unavailable時も生成済み候補の編集とtemplate / rule / assetによる非AI workflowを完了できるようにする。
- modelが存在しない、deviceで動かない、license不適合、推論失敗の場合も、chord、arrangement flow、instrument、FXのtemplate / rule / asset engineで制作を継続できるようにする。
- 外部音声認識や生成AIを価値の前提にしない。採用する場合もlocal/fake境界から段階的に検証する。
- UI正本は独自案`Pastel Patchboard`とする。Hallmark案は比較履歴として保持し、production visualへ採用しない。
- 新規曲の開始経路は、(1) `パッチボードで組む`、(2) `AIで編集可能な土台を作り、鼻歌メロディを追加する`、(3) `最初の鼻歌をseedに曲を作る`の3つとする。Phase 1の実装優先順位はパッチボード、AI土台、鼻歌先行の順とし、3経路は同じProject / Track / Lane / NoteEventへ合流する。
- AI StarterはChord / Bass / Drum / Pad / Arp等を別々に編集できる土台を作り、flat audioだけを正本にしない。利用中のAI / rule fallbackを表示し、padによる部分差替えで未編集小節を消さない。
- Chord候補は`基本`、`彩り`、`意外`へ分け、key compatibility、前後のvoice-leading、noveltyを決定論的にscoreする。無制約random生成をprimaryにしない。
- Harmony identityと演奏patternを分離する。Bass / Arpは各10種、Drumはgroove / fillを含む22種、合計42の4小節performance patternを持ち、Bass / Arpはchord root / toneへ追従し、Drumは同じphrase境界へ整列する。適用先は対象roleのMain laneだけとし、手編集NoteEventと他phraseを保護したまま通常のDAW / MIDIへ合流する。
- 内蔵音色は名前だけで区別せず、foregroundの尖ったsupersaw / pluckとsupporting pad / sub等をoscillator layer、detune、filter envelope、ADSR、stereo spreadで音響的に分ける。pattern候補もtimbre roleへ適合させる。
- 内蔵音色は少数の見本で完了扱いせず、Chord / Bass / Lead / Pad / Pluck / Arp / Synth等の役割別bankへ拡張する。各presetは聴感上の用途、layer、envelope、filter、stereo特性が区別でき、同名差分だけで数を水増ししない。
- Chord Padは専用9音色だけへ閉じず、内蔵136音のうち60 tonal profileをChord / Synth / Pad / Lead / Arp / Bass familyから和音として選べる`Voice Deck`を持つ。音色familyはtabで絞ってよいが、現在音色と総数を常時表示する。Harp、Pizzicato、Music Box、Chorusを含め、Drum 20、Percussion 8、FX 24、Transition 24を持ち、riser、fall、reverse、impact、burst、stutter、fill等を音響profileとevent列で分ける。
- 02 展開を整えるでは、Intro / Verse / Build / Drop / Break / Final Drop向けのKawaii Future Bass伴奏フレーズを4小節単位で挿入できる。対象section、Mood、現在コード進行、コード音色から上位2件と一致理由を決定論的に示し、kitはコード進行、HOLD / PULSE / SYNC、Bass / Arp / Drum、Pad / Synth、音色を1 commandで同期する。Melody、手編集音、他phraseは保護する。
- 複数発音と音色をまとめたSound Chunkを通常NoteEventへ展開し、built-in recipeと選択音から保存したProject内recipeを同じ棚から別小節へ挿入できるようにする。外部WAVを前提にせず、挿入結果と保存recipeをproject fileへ保持する。
- Chord候補の`基本 / 彩り / 意外`は排他的tabではなく属性とする。全候補を同時に表示し、基本7 degreeを順番に並べ、extension / borrowed / secondaryを関連degreeの近くへ置く`Harmonic Atlas`を採用する。
- Pattern Boardの4 / 8は1 phrase内のprogression step数とし、各phraseを16拍＝4小節へ固定する。各stepは8分音符単位で、付点4分を含み、少なくとも1つのAUTO stepが残り拍を吸収する。4小節phraseは上限なく追加でき、desktopは8小節／譜面行、smartphoneは4小節／段で縦に積む。全曲loop、Web Audio、MIDI、save / reloadはphrase連結から同じdurationを算出する。
- コード進行は小節番号・コードsymbol・正確な長さが読める譜面として表示し、人向けtext、ABC 2.1、全曲Creative Brief Markdown、構造化JSON、`.mctproj`をcopy / downloadできるようにする。Promptは曲の設計、音の役割、展開、コードの各surfaceから出せる。
- AI handoffは一貫してinstrumental / BGM専用とし、`Instrumental only / no vocals / no lyrics / no spoken words`を出力へ含める。主線はLead / Melody instrumentとして扱い、外部生成appではInstrumental modeを有効にする案内を出す。
- Pastel Patchboardのlayout正本は維持し、色だけを`Dark Pastel Studio`、vanilla基調の`Vanilla Pastel`、役割識別を強めた`Friendly Signal`の3 token themeで切り替える。themeは端末localStorageへ保存し、Project音楽dataへ混ぜない。DAW piano-rollは各theme内で最も暗い編集面とする。
- 矩形はworkspace tabと編集gridに残すが、全controlを同じ四角にしない。Chord nodeは関係図上のkeycap輪郭、voiceはcompact selector、Patchboard / Humming切替は左上の丸い2 controlを明示例外とする。
- Night Gridのinteraction color grammarは、yellow＝操作可能control、pastel＝音楽データ、green＝成功・接続、red＝失敗・録音・削除、gray＝非操作・disabledとする。一般panelをsignal色で塗らず、yellow outline / 動詞label / focus / 配置を併用してclick可能性を示す。
- 全画面の情報設計は、全体像を見せたまま関係を位置で示し、現在値と次の操作を同じ視野へ固定し、1 tapで音・配置の結果を返す。tabは補助分類には使うが、主要選択肢を隠すために使わない。単なる小型化ではなく、意味ごとに形と密度を変える。
- 見出しは情報構造を支える足場であり、全sectionへ機械的に付ける装飾ではない。配置、接続、現在値、操作結果だけで役割が自明になったsectionは、screen reader向けaccessible nameを保持したまま表示titleを外し、制作面へ空間を返す。
- Dark surfaceは純黒へ寄せず、低彩度の青紫・藤・青緑を含むdark pastelへする。yellow操作色と音楽dataのpastel信号色は維持し、背景面は柔らかな色相差と濃淡で階層化する。
- メイン作曲画面に大きなproduct title / subtitleを常時表示せず、必要なら開始画面へ分離する。作曲画面ではproject名を小さく扱い、制作フェーズは固定headerではなく作業部品として置く。
- interaction stateの見本や説明は常時表示せず、`?` help disclosureから確認できるようにする。
- 展開assetはtoastだけの見本にせず、候補を選択してsection flowが変わる操作にする。
- 書き出し前でもWeb Audio等でリアルタイム試聴できることを目指す。prototypeは明示click後だけ鳴る内蔵シンセで実現し、実音源engineの完成とは表現しない。
- AI modelはcapability別に自動routingし、使用中・予定modelとfallbackを表示する。同じ目的の複数modelを利用者が毎回選ぶUIは初版要件にしない。
- 最初の画面は複数projectの一覧と新規作成入口にする。新規作成は上記3経路を順序付きで提示し、入口選択後だけ、その経路に必要な曲名、genre、Mood、Key、BPM、曲の流れ等を滑らかに展開する。未選択時に全fieldを常時露出しない。
- production surfaceは、1小節patternとchord padで手で組む`Pattern Board / Patchboard Workbench`を現在のprimary完成線とする。これを閉じた後に、選択条件から具体的なinstrumental promptと編集可能なsymbolic foundationを作る`AI Starter`、次に鼻歌先行の`Humming Studio`を作り込む。全surfaceは同じProject / Track / Lane / Audio Engineを共有し、生成結果もDAW editorとStandard MIDIへ送れる状態を維持する。
- draggableなsection、block、note、assetはhover / focusで穏やかに浮かせ、drag中の対象、grab状態、drop候補をoutline、shadow、cursor、補助文で明示する。motion軽減設定ではtransform animationへ依存しない。
- `02 展開を整える`はコード譜と4小節挿入先を共有INSERT TARGETとして常時上部へ置き、その下のINSERT SOURCEだけを`コード・音色 / コードセット / 伴奏 / FX・Fill / 音色割当`の5 tabで切り替える。挿入可能物はclick / tapとdrag & dropを同じProject commandへ接続し、挿入先と情報panelを形・面・accentで区別する。
- `01 曲の設計 / 02 展開を整える / 03 詳細の編集`を同じ3 workspace tabで使い、同じProjectを分岐させない。旧`ラフ制作 / カスタマイズ`二重切替と、重複するArrangement専用tabは表示しない。
- 曲の長さ・雰囲気・key・BPMはAI専用promptではなくproject-wideな音楽条件とする。新規project作成と先頭の「曲の設計」で扱い、asset推薦、互換性、展開長、再生tempoへ反映する。AIには自動で参照させ、AI固有の文章指示・参考音・生成範囲とはUI上もdata上も分離する。
- 01と02はAI StarterまたはChord Padから曲条件、コード譜、音色、section、Creative Briefを作る。03は同じProjectのDAW-like editorでpitch、timing、length、velocity、track / mixerを扱う。section編集は01の独自価値として保持する。
- 展開sectionはIntro / Build / Drop / Break / Bridge / Outro等をtemplate追加でき、pointer dragまたはkeyboard到達可能な順序buttonで並べ替えられる。BreakとBridgeは別roleとして保持する。
- 鼻歌は曲全体を置き換えず、section、開始小節、長さを選んだ範囲へmelody seedとして差し込む。
- 60分仕上げのrhythm gridは少なくとも1/16、1/16 triplet、1/32へ到達できるようにする。全曲noteはPPQ tickで保持し、Canvas viewport内だけを描画して大量のgrid cell / note DOMを作らず、軽量性を実測する。
- カスタマイズDAWの最優先操作は、note選択、空白dragの矩形範囲選択、Shift追加選択、複数noteの一括pitch / timing移動、drag ghost / delta、右端length、空白double click追加、Delete、duplicate、snap、quantize、velocity、zoom / scroll、undo / redoとする。copy / pasteとMPE / plugin編集は後段とする。
- カスタマイズDAWのpitch目盛りは音名だけの同幅列にせず、A0〜C8の88鍵を白鍵と短い黒鍵で区別する縦型ピアノ鍵盤とする。各鍵をCanvas rowと同じ高さへ揃え、初期表示はC6〜C3付近、wheelで上下へ移動して表示外pitchへ配置できるようにする。鍵盤発音は別要件とし、目盛りを演奏controlと誤認させない。
- DAWのCopy、移動、複製等の一時結果は全幅bandで制作面を1行占有せず、title横のcompact live statusへ置く。選択0件の操作結果を成功表示しない。
- Studio Oneの公開情報からhardware accelerationとLinuxのVulkan / OpenGL ES要件は確認できるが、piano roll内部rendererは未公開である。「内部実装の再現」とは表現せず、Canvas 2D、viewport culling、Pointer Events、audio thread分離で同種の操作特性を作る。
- 展開sectionの種類はtrack role用の色と競合させず、neutralな枠形状とlabelで表す。色はmelody、chord、drums等のtrack対応へ優先して使う。
- 音のピースは別画面や書き出しを経由せず、カード内の1 click / tapで楽器種に合う短いsample phraseを即時試聴できるようにする。
- productionで必要な状態labelは常時表示してよいが、prototype説明、開発状態、補足subtitleは常時表示しない。必要な補足はtooltip、screen reader text、`?` disclosureへ退避する。
- 鼻歌由来melodyのpitch / rhythmは極力維持し、事前chordと合わない場合はchord / accompaniment側を合わせる。AIのflat audioだけを正本にせず、編集可能なsymbolic trackを必ず保持する。
- 各instrumentは少なくともmain / sub laneを持ち、track追加、multiple selection、copy / paste、range loop、mixer、simple FX、automation、MIDI inputへ到達できるようにする。MPEとexternal VST pluginは今回含めない。
- Phase 1のexportはmaster WAV、track WAV stem、standard MIDI、project bundleとする。browser内project保存とdownload可能project fileを併設し、autosaveせずdirty close warningを出す。
- WindowsのWQHD / Full HDをprecision editorの第一対象とする。smartphoneではDAW-like precision note editingを要求せず、長押し中だけ鳴り続けるChord Pad、4小節／段の縦型コード譜、phrase追加・拍数編集、試聴、Prompt copy / file handoffをprimaryにする。

## 初版の非対象

- Windows native application
- vocal / lyrics生成
- commercial versionと商用利用制御
- tone / sound自作機能
- autosave
- offline対応
- MPE
- external VST plugin
- Cloudflare経由のWeb app外部公開とpublic deploy
