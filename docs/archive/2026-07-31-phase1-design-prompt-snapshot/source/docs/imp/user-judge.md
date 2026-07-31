# ユーザー判断

## JUDGE-001: 最初の配布surface

- 状態: 決定（2026-07-21）
- 採用: Web / PWA
- 非採用: Windows native / Hybrid desktop
- 根拠: Windows nativeは配布の手間があり不要。smartphoneでも新規作成、途中編集、試聴、共有を行いたい。

## JUDGE-002: デザイン正本

- 状態: 決定（2026-07-21）
- 採用: 独自案「Pastel Patchboard」 `docs/design/prototypes/pastel-patchboard/index.html`
- 非採用: Hallmark案。比較履歴として保持するがproduction visualへ進めない
- ユーザー理由: Pastel Patchboardは余計な丸・角丸が少なく、Hallmark案よりかなり好みに合う
- 追加決定: main workbenchへ大きなtitle / subtitleを常時表示しない。制作phaseは固定topではなく画面部品、状態見本は`?`内、展開assetは選択可能、音カテゴリは多数、realtime previewを置く
- Phase UI: 曲の設計、音、展開、melodyを大きなworkspace tabへ分ける。10分は外枠と音色、30分は展開と範囲鼻歌、60分は全曲DAW-like note editingとし、1/16T・1/32まで扱う
- Project foundation: 長さ・雰囲気・key・BPMはproject-wide条件として新規作成と先頭の「曲の設計」で扱う。persistent headerから外し、AI固有の文章指示・参考音・生成範囲とは分離する。AIはproject条件を自動参照する
- Arrangement edit: BreakとBridgeを別roleにし、section template追加、pointer drag並べ替え、keyboard到達可能な順序buttonを持つ。10分の固定説明は常時表示せずtooltipへ退避する
- Humming range: 鼻歌は曲全体ではなく、section・開始小節・長さを選んだ範囲へ差し込む
- Detail priority: ユーザーはDAW機能を多く望む一方、自身での優先順位付けは難しいと述べた。鼻歌melodyの自作感へ直結するselection、pitch / timing drag、length resize、double-click add、delete、duplicate、snap、quantize、velocity、whole-song zoom / scroll、undo / redoをimplementation P0とする。複数選択・copy / paste・loopは次段、automation / MPE / plugin editは後段
- Visual mapping: Intro / Build / Drop等の展開種別は色ではなくneutralな枠形状で区別し、色はmelody / chord / drums等のtrack対応へ使う
- Audition: 音のピースはカード内のbuttonを1 tapすると種別に合う短いsample phraseを試聴できるようにする
- Project start: 最初に複数projectの一覧と新規作成を置き、「鼻歌から始める」から準備、録音、解析、音符候補の遷移を最初に確認できるようにする
- Copy: prototype説明や一般的subtitleを常時表示しない。Home AIオフライン等の実状態labelは残し、補足はtooltip / helpへ移す
- Model UI: capability別に必要なmodelを自動利用し、何を使うかは表示する。同じ目的の複数AIを手動選択する必要はない

### 2026-07-22 visual refinement

- Pastel Patchboardの構造は維持し、白ベースを引き継がず、濃紺〜黒のDTM-like surfaceへ変更する。
- 特に60分のメロディ編集画面は黒いpiano-roll / Canvasを正本とし、角丸cardではなく矩形の罫線と余白で情報を整理する。
- 操作色の規則は、yellow＝押せる／変更できるcontrol、pastel＝note・track・asset等の音楽データ、green＝成功・接続、red＝失敗・録音・削除、gray＝非操作・disabledとする。primary actionはyellow塗り、secondary actionはyellow枠にし、色だけでなく枠・動詞label・配置・focusでも操作可能性を示す。
- 2026-07-22のAI自律確認では1440 / 768 / 375pxと全操作E2Eをpassしたが、見た目・操作感は★3で止める。ユーザーが実画面でブラッシュアップ完了と判断した後だけ★4へ進める。

### 比較履歴

- 候補A: Hallmark案 `docs/design/prototypes/hallmark/index.html`
- 候補B: 独自案「Pastel Patchboard」 `docs/design/prototypes/pastel-patchboard/index.html`
- 比較条件: 同じ機能、同じcopy、同じ仮データ、desktopとmobile、主要操作state
- 比較入口: `docs/design/prototypes/README.md`
- 検証: `docs/design/prototypes/browser-qa-report.md`。Chrome 150で4 surface x 5 viewport、Pastel 44操作pass。cross-browser、実sample / mic / AIは未検証

## JUDGE-003: voice inputの役割

- 状態: 一部決定・要件発見中
- 決定: vocal / lyricsではなく、本人のhummingをmelodyのseedにする。microphoneなしで同一結果へ到達することは要件にしない。
- 希望: FXの雰囲気はvoice memoまたは選択式で指定したい。
- 未決: voice memoがspeech、口真似、参考audioのどれか、speech commandとして言いたい短い言葉と期待する変更、humming-to-melody方式。

## JUDGE-004: Local music AIの採用境界

- 状態: Product境界を一部決定・技術調査待ち
- 希望: 公開music AIをlocal環境で組み込めるなら、伴奏・melody加工・FX候補の補助に使う。
- 決定: AIは曲作りの多くを担ってよい。ただし、本人のhumming・イメージ指示への追従と、生成後の高い編集可能性を必要条件にする。
- 編集優先度: 最優先はmelody pitch / rhythm。chordの直接編集は求めず、自動生成・候補選択・asset差し替えでよい。
- 判断材料: model license、商用/非商用条件、model size、必要GPU/RAM、WebGPU/WASMまたはlocal companion、mobile対応、生成待ち時間、入力制約への追従、structured / editable output、部分再生成。
- 未決: 2番目に優先する対象、指示追従の合格基準、melodyの出力representation。
- 採用戦略: 1 modelへの全面依存ではなく、用途ごとにfitするmodelだけを部分採用する。未対応箇所はtemplate / rule / asset engineで補う。
- landscape shortlist: Basic Pitch TS、ACE-Step 1.5、Stable Audio 3、MusicGen Melody、CLAP、Magenta.js。詳細は`docs/research/music-ai-model-landscape-2026-07-21.md`。
- product非採用: SongGeneration 2はofficial licenseがproductionを禁止するため、source比較に限定する。
- 次の判断: DiT-only生成WAVの主観的genre fitと、次の10,240MiB以下profileをどのcapabilityで検証するか。
- spike判断: 承認済み。ACE-Step 1.5のRTX 5080 fixtureはDiT-only / 1.7B LM thinkingとも実行成功。主観品質とhumming追従は未判断。
- 禁止: feasibility確認前に特定modelや外部providerを採用済みにしない。

## JUDGE-005: User assetとlicense

- 状態: 要件発見・設計待ち
- 希望: 生成assetとuser uploadを扱い、BOOTH等で入手した音源を取り込む。
- 追加候補: 所有するStudio One製品版の音源等を利用できるなら流用する。
- 判断材料: 利用許諾、asset種別とformat、export可否、加工可否、生成音声への混入、project file同梱、再配布、share、license metadata。Studio One資産を直接利用できる前提にしない。

## JUDGE-006: Commercial scope

- 状態: 初版非対象として決定
- 将来候補: commercial利用時に一部機能をdisabled / grey-outする制御。
- 現在: 商用判定やcommercial versionを実装しない。

## JUDGE-007: Home inference topology

- 状態: Product境界決定・transport候補未決
- 採用: heavy music generationはuser-managed home RTX 5080 serverで実行し、Web / PWAからjobとして利用する。
- smartphone degradation: heavy generationを必須にせず、生成済み候補の編集とtemplate / rule / assetによる非AI workflowを保証する。
- GPU budget: 1 process peak reserved 10,240MiB以下をhard capとする。実測allowlistだけを起動する。
- model residency: ACE-Step DiT-onlyはtext2music 7,504MiB、source / reference条件付き`complete` 9,624MiBで許可し、保守値は9,624MiB。DiT + 1.7B LMは14,128MiBのため、生成成功済みでも不採用・起動禁止。
- local storage permission: Gドライブ側のLLM領域へアクセスできない場合、Cドライブの専用directoryを別途作成して操作してよい。既存の`C:\LLM\tools`、`models`、`cache`、`outputs`の用途分離を踏襲する。
- transport candidate: Cloudflare Access + Tunnel + custom async gateway。後段候補はprivate R2とCloudflare Queues pull consumer。
- 未決: Cloudflare account / domain、Access identity、artifact retention、home server sleep / wake、live E2E。
- 禁止: Accessなしのraw model API公開、service tokenのPWA埋込み、router admin / raw portのpublic exposure。

## JUDGE-008: Pattern-first制作基盤への再編

- 状態: 決定（2026-07-22）
- 実使用判断: 「鼻歌から一曲」の生成品質は振れ幅が大きく、現状は制作の基盤としてほぼ使えない。
- 採用: Humming / ACE改善を一旦保留し、1小節ごとのpattern、選択中の音色で即時発音する大きなchord pad、chord progression、instrument差替えをprimary workflowにする。
- 最低要件: chord padは簡易鍵盤ではない。padを押したその場で、現在選択しているinstrument / timbreの和音が鳴る。
- 音色判断: Future Bass / Coreで前面に出る尖ったsaw / pluckと、補強するsoft pad / sub等を役割別に用意し、名称だけでなく音響profileを変える。patternも音色roleに適合させる。
- Handoff: browser内で作ったharmonyとrole別noteをStandard MIDI / WAVとしてStudio Oneへ持ち出し、最初の一歩を短くする。Studio One専用asset / plugin連携は初版要件にしない。
- 保持: Humming Studio、Basic Pitch、ACE-Step経路、既存Project dataは削除せずexperimental secondary surfaceとして残す。
- 詳細編集の保持: 既存の60分DAW詳細編集画面は、Pattern Boardの後段で音符・長さ・timing・velocity・mixを詰める採用済みsurfaceとして残す。ユーザーは外観が概ね良さそうと感じているが、まだ十分にレビューしていないため、現在は★3・ユーザーレビュー待ちとし、削除・置換・完成扱いをしない。
- 比較根拠: `docs/research/chord-pad-pattern-workflow-benchmark-2026-07-22.md`。推奨Architectureは`docs/arch/pattern-board-foundation.md`。

## JUDGE-009: 3入口、AI Starter、多数音色、操作feedback

- 状態: 決定（2026-07-22）・local実装／AI自律確認済み・★3ユーザーレビュー待ち
- 3入口: `AI Starter`、手動`Pattern Board`、experimental `Humming Studio`を用意し、入口に関係なく同じMIDI譜面、60分DAW、exportへ滑らかに進める。
- AI Starter: 生成AIまたは明示fallbackが最初に曲の土台を作り、その状態から遊べるmodeを追加する。flat audioだけでなく、Chord / Bass / Drum / Pad / Arp等を編集可能なsymbolic dataとして保持する。
- 部分編集: chord padで1小節を差し替えても、未編集のAI生成小節を消さない。
- 音色: 少数presetで終了せず、Future Bass / Coreの役割を覆う多数の音色を用意する。名称だけで数を増やさず、尖ったforegroundと補強層を音響profileで区別する。
- 演奏pattern: 2026-07-23にBass / Arp各10種、Drum 22種、合計42種のharmony追従browserをlocal実装・AI自律確認した。選択phraseだけを置換し、他phraseと手編集noteを保護する。音楽的な使い分けは★3でユーザーの実耳reviewを待つ。
- UI: hover、focus、drag中に要素を穏やかに浮かせ、現在つかんでいる対象とdrop候補を明確にする。色だけに依存せずreduced motionにも対応する。
- 完成境界: 自動確認後もUI / 操作 / 音楽品質は★3で止め、ユーザーの実操作ブラッシュアップ完了後だけ★4へ進める。

## JUDGE-010: Chord Pad Harmonic Atlas再設計

- 状態: 決定（2026-07-22）・2026-07-23 local実装／AI自律確認済み・★3ユーザーレビュー待ち
- 音色数: Chord Padの9音色では不足。少なくとも3倍規模へ増やし、Chord以外のSynth / Pad / Lead / Arp / Bass系も和音として即時発音できるようにする。Audio Paletteで使いたいと思ったtonal音色はChord Padからも選べること。
- 音色UI: 2026-07-23時点で60 tonal音色へ拡張した。全件を同じ大きな四角buttonへ並べず、family tabで切り替えつつ、現在の音色名・family・総数を常時表示し、1画面のスクリーンショットでも何を鳴らしているか判別できること。
- コード候補: `基本 / 彩り / 意外`の分類は残すが、候補を隠す排他的tabにはしない。全候補を同時表示し、degree順の基本列と関連する彩り・外側コードを近接させた関係図にする。全候補は1 tapで即時発音・配置できること。
- Progression: 4 / 8コードを並べた後、各コードの拍数を指定できるようにする。1拍の次に3拍を置く等の連続進行を「音を組む」だけで完成できること。
- 形状: 四角いbuttonが連続して識別しづらい状態を解消する。workspace tabは矩形のまま、chord node、voice selector、surface selectorは役割に応じて輪郭を変える。
- Header: 全幅のPatchboard / Humming Studio切替を、左上に置く丸い2 buttonへ縮小する。active / inactiveを明示し、余白を作曲面へ返す。
- 全画面の思想: Chord Padで示した「全体を見せる、現在値を固定する、関係を空間で示す、意味ごとに形を変える、1 tapで結果を返す」を画面全体の設計原則にする。単にbuttonを小さく詰めることはしない。
- 色調: 現在の黒は真黒すぎて威圧感がある。青紫を含むdark pastelを基底にし、面の濃淡と僅かな色相差で柔らかくする。yellowの操作grammarとpastelの音楽data grammarは維持する。
- 完成境界: 再設計後も★3でユーザー確認を待ち、実操作のブラッシュアップ完了後だけ★4へ進める。

### 2026-07-23 16拍固定feedback

- 肯定: コード全体の配置は前版よりだいぶ良くなった。
- 修正: STEPごとの拍数変更は維持するが、拍数の合計が16拍＝4小節から外れてはならない。
- 採用: 4 / 8は1 phrase内のコード数だけを表し、どちらも4小節。1つの拍数を変更したら残りSTEPを8分音符単位で自動配分し、phrase合計16拍を維持する。自動調整対象は`AUTO`として表示する。
- 完成境界: technical proof後も操作感は★3のまま。自動調整の予測しやすさをユーザーが確認した後だけ★4へ進める。

## JUDGE-011: 無制限Chord Score、Instrumental Brief、2モード、mobile、3テーマ

- 状態: 決定（2026-07-23）・local実装／AI自律確認済み・★3ユーザーレビュー待ち
- Chord Score: 4小節は曲全体の上限でなくphrase追加単位。上限なく追加し、desktopは8小節／譜面行、smartphoneは4小節／段で縦に積む。各段へ小節番号、コード、長さ、AUTOを残す。
- 拍数: コード長は8分音符単位、付点4分を含む。三連符はChord Score surfaceへ含めない。phrase内の自動調整と全曲loop / MIDIを一致させる。
- Handoff: 人向けコード譜、ABC 2.1、全曲Creative Brief Markdown、構造化JSON、`.mctproj`をcopy / downloadする。Promptは曲の設計、音の役割、展開、コードの各surfaceから出せる。
- Instrumental: 生成AIへ渡す内容は一貫してinstrumental / BGM専用とし、歌詞、歌声、spoken wordsを禁止する。主線はLead / Melody instrumentとして記述し、外部生成appではInstrumental modeをONにする案内を出す。
- 制作段階: 10 / 30 / 60分の3 surfaceを廃止し、設計・コード・音色・section・Promptを扱う`ラフ制作`と、保持したDAW-like editorの`カスタマイズ`へ統合する。Intro / Verse / Build / Drop / Break / Bridge / Outroは残す。
- DAW: 空白drag矩形選択、Shift追加、複数noteの一括move、drag ghost / delta、snap、cancel、undo / redoを追加する。既存DAWはユーザーレビュー前の★3で保持し、置換・削除しない。
- Smartphone: Chord Padは押している間sustainし、release / cancelで停止する。ラフ、縦型コード譜、Prompt共有をprimaryにし、precision DAW全操作は要求しない。
- Theme: 現行layoutを維持し、Dark Pastel Studio、Vanilla Pastel、Friendly Signalの3色だけをcompact selectorで切り替え、端末へ保存する。
- 完成境界: 88音bank、6曲starter、進行template、responsive DAW、88鍵wheel-scrollピアノロール追加後の25 files / 108 unit tests、Chromium 13 / 13 journeyの単一run、WQHDから375pxの3-theme QA、dark QA、PWA QAまでAI自律確認済み。星取り表は★3で止め、ユーザーが各部品をブラッシュアップ完了と判断した後だけ★4へ進める。

## JUDGE-012: 定番コード進行から開始し、完成後も調を変えられる

- 状態: 決定（2026-07-23）・local実装／AI自律確認済み・★3ユーザーレビュー待ち
- 開始支援: コード進行の作り方が分からない状態から始められるよう、一般的／有名なコード進行templateを用意し、1 click / tapでChord Scoreへ追加できるようにする。
- Templateの役割: templateは完成曲ではなく編集可能な出発点とする。配置後もコード差替え、STEP拍数変更、phrase追加、試聴、Prompt / MIDI出力へそのまま進めること。
- Key変更: コード進行を複数phraseへ追加した後でも、曲全体の調を変更できるようにする。全phraseのコード記号と再生・exportを同じkeyへ同期する。
- 保護境界: ユーザーが明示していないため、key変更で手入力／鼻歌のMelodyを勝手に移調しない。コードと、コードへ追従する未編集generated Bass / Arpだけを更新し、この挙動をUIへ表示する。
- 完成境界: 自動テストとWQHD／mobile browser確認後も、templateの選びやすさと音楽的な納得感は★3でユーザーレビューを待つ。

## JUDGE-013: 曲構成は左→右のレール、カスタマイズMixerは崩れを修正

- 状態: 決定（2026-07-23）・local実装／AI自律確認済み・★3ユーザーレビュー待ち
- 曲の流れ: sectionは左から右へ順番に再生されることが初見で分かる形にする。単純な真四角の列ではなく、方向線、矢印、接続、連番を使う。
- Section追加: Intro〜Outroの独立した追加button群を廃止し、現在の流れの一番右へ空の`＋ 流れを追加`slotを置く。そこで追加するsection種別を選ぶ。
- 保持: sectionのdrag animationは良い評価のため残す。長さ、energy、transition、前後移動、削除、flow assetも維持する。
- 音の配置: 音色選択ではなく、選んだ音を各sectionのMain / Subへ置く機能だと画面内で説明する。目的が分からない`音の配置`という名称だけで提示しない。
- カスタマイズ: ユーザーのスクリーンショットで、Mixer card内のselect / range / M / Sが隣cardへはみ出す崩れを確認した。card最小幅とcontrol内包を修正し、WQHDだけでなく1648px相当でも崩れないようにする。
- カスタマイズ再生: global headerまで戻らず、Intro / Bridge / Drop等のsection overviewより上で現在の譜面を再生／停止できるようにする。
- Note選択: 範囲選択済みnoteが分かりづらいため、同じpinkの濃淡ではなく補色系のfillと明瞭な輪郭へ変える。drag中表示は現在の良い挙動を保持する。
- 進行bar: `表示 1`の標準controlらしい見た目を、表示小節と全体位置が分かるDAW railへ刷新する。
- 全体確認: カスタマイズ結果はMelodyだけでなく、コードと伴奏を含む現在の曲全体として上部再生できること。Chords / Bass / Arp等の編集track切替もselectだけへ隠さず明示する。
- 単体音／密度: FX音は使う前に単体試聴できるようにする。FXとAI LayerのMixer card、1音Inspectorは機能を捨てずに圧縮し、`Velocity ±8`は音の強さを上下する操作だと読める表記にする。
- 完成境界: browser計測とscreenshot後も、曲構成の分かりやすさとMixerの見た目は★3でユーザーレビューを待つ。

## JUDGE-014: 音のピースの密度と試聴品質を引き上げる

- 状態: 決定（2026-07-23）・136音bank、24複合FX / Fill、末尾異音修正をlocal実装／AI自律確認済み・★3実耳レビュー待ち。
- 種類数: Chordは現状を基準にし、それ以外のtonal系は全体として約2倍、Drum / Percussion / FX / Transitionは約4倍へ増やす。特にriser / sweep / burst等の「シュワー」「弾ける」音とsection境界用transitionを不足させない。
- 品質境界: 名称だけ増やさず、oscillator / noise、envelope、filter、stereo、rhythmの差で役割を分ける。license未確認sampleは使わず、現在のWeb Audio合成境界で増強する。
- 試聴不具合: カード試聴の末尾に聞こえる口笛状の音は仕様と決めつけず、event planとreleaseを調査する。選択asset以外の音が混入している場合は不具合として除去し、意図したtailなら用途を表示する。
- 完成境界: 自動確認後も聴感品質は★3でユーザーの実耳reviewを待つ。

## JUDGE-020: 挿入先を上、挿入物を下へ置き、section単位でも並べ替える

- 状態: 決定（2026-07-23）・local実装／AI visual・操作確認済み・★3ユーザーレビュー待ち。
- 初期配置: `音を組む`はコード譜と4小節挿入先、Harmonic Atlas、挿入アイテム群の順を初期値とする。装飾titleへ空間を使わず、挿入可能物は小角丸、淡いcategory面、accent、grab表示で情報panelと区別する。
- 挿入操作: コード、進行template、伴奏phrase、role pattern、音のピース、複合FX / Fillはclick / tap fallbackを残したままdrag & dropでき、同じProject commandへ合流する。
- Section操作: 主要sectionは専用handleで上方向を含む任意順へdragでき、keyboard用上下buttonを持つ。順序は端末localStorageへ保存し、`初期配置`で指定順へ戻す。Projectの音楽dataへ混ぜない。
- 完成境界: WQHD / smartphoneと保存復元の自動proof後も、ハンドルの見つけやすさと並べ替えの気持ちよさは★3でユーザー確認を待つ。

## JUDGE-015: 曲の設計はコード・音色・展開へ作用し、展開は制作中にも変えられる

- 状態: 決定（2026-07-23）・local実装／AI自律確認済み・★3ユーザーレビュー待ち。
- 連動: 曲の長さ、雰囲気、key、BPMを孤立した入力欄にせず、推奨section構成、推定再生時間、コード記号、候補音色、再生tempoへ参照させる。自動提案で既存ユーザー編集を黙って上書きしない。
- 選択支援: section列と想定時間を持つ一般的な構成templateを用途つきで比較できるようにする。実在曲を例示する場合は出典を示し、曲そのものの模倣templateにはしない。
- 横断編集: `展開を整える`だけでなく`音を組む`からも、Build延長、Bridge追加、並べ替え等へ到達でき、同じProject arrangementを更新する。
- コード面: 全曲試聴が現在のChord Score全体を鳴らすことを視覚・文言で明示する。定番進行templateの適用先は最初の4小節へ固定せず、追加済みの任意phraseを選べる。
- 完成境界: 自動テストとbrowser QA後も、連動の分かりやすさとtemplateの納得感は★3でユーザーレビューを待つ。

## JUDGE-016: 再利用可能な既製曲を編集スターターにする

- 状態: 決定（2026-07-23）・個別license確認済み6 studyをlocal実装／AI自律確認済み・★3ユーザーレビュー待ち。
- 入口: `曲の設計`に、既存曲の構成・コード・旋律を確認して通常Projectとして読み込む`既製曲から始める`sectionを追加する。
- 編集性: audioだけを流す見本にせず、MIDI譜面、Chord Score、section、trackへ分け、読み込んだ後は音色、音符、コード、展開、key / BPMを編集できること。
- ライセンス: public domainまたは明示的に改変・再配布可能なscore / MIDIを優先し、出典とlicenseを各presetに表示する。商用音源という名称だけで包括利用可能と判断しない。録音物を含める場合は作曲権と録音権の両方を確認する。
- 量: 調査で安全に採用できる素材を複数追加し、同じ構成の名前違いで水増ししない。
- 完成境界: 技術・license proof後も曲データの有用性は★3でユーザーレビューを待つ。

## JUDGE-017: 見出しは1行、補足は必要なときだけ右へ置く

- 状態: 決定（2026-07-23）・主要surfaceへ段階適用／AI visual確認済み・★3ユーザーレビュー待ち。titleless化は品質反復として継続する。
- Typography: 大きめの主題を左へ1行で置き、操作判断に必要な補足だけを同じ行の右へ置く。eyebrow、大見出し、subtitle、説明を常に4段積むpatternは使わない。
- Copy: `Chords / chord`等の同義反復、飾り文、機能名の言い換えだけの説明を削る。status、error、現在値、license、操作結果は保持する。
- Section: 見出しと機能surfaceを同じ矩形cardにせず、typography、rule、余白、accentで一組のsection開始を示す。次のrole pattern等へ唐突につながらない間隔を設ける。
- Titleless goal: 洗練後は見出しさえ常設しない状態を目指す。位置関係、controlの形、現在値、接続で機能が理解できるsectionは、screen reader用の名称を残して表示titleを削減する。意味が伝わらない段階で一律に消さない。
- Research link: コード進行の根拠linkは各cardから外してsection末尾へ集約する。card本文は響き・感情・使いどころを優先する。
- 完成境界: WQHD / 1648 / mobileで確認後も情報量と見た目は★3でユーザーレビューを待つ。

## JUDGE-018: DAWのpitch目盛りを縦型ピアノ鍵盤にする

- 状態: 決定（2026-07-23）・local実装／AI visual確認済み・★3ユーザーレビュー待ち。
- 表示: カスタマイズDAW左端は同幅の音名だけを並べず、白鍵と短い黒鍵が区別できる縦型ピアノ鍵盤にする。音名は残し、C音をオクターブ境界として強調する。
- 整列: A0〜C8の88鍵をCanvas pitch rowと同じ18pxで揃え、鍵盤の上下端、note表示、pointer座標をずらさない。初期viewportは従来のC6〜C3付近とする。
- Theme: 鍵盤は音楽UIとして中立なblack / whiteを3テーマで共通使用し、白鍵上は濃い文字、黒鍵上は白い文字とする。
- 操作境界: 現時点の鍵盤はpitch目盛りであり、押して発音する演奏controlにはしない。既存Canvas編集、MIDI、NoteEventを変更しない。
- 完成境界: 88鍵分類、wheel scroll、初期画面外pitch配置のunit / Chromium、3テーマWQHD、1648px、375pxのvisual QA後も、見た目の最終判断は★3でユーザーレビューを待つ。

## JUDGE-019: DAW操作結果の全幅bandを撤去する

- 状態: 決定（2026-07-23）・local実装／AI visual確認済み・★3ユーザーレビュー待ち。
- 表示: Copy、移動、複製等の結果をgreenの全幅1行として常設せず、DAW title横のcompact live statusへ表示する。
- 0件操作: 選択0件のCtrl+Cは`0音をコピーしました`を出さず、clipboardも更新しない。
- Accessibility: 一時結果の`role=status`は保持する。errorやMIDI接続状態は別の意味を持つため削除しない。
- 完成境界: 全幅bandがDOMに存在しないこと、実コピー時だけcompact statusが出ることをunit / screenshotで確認後も、最終密度は★3でユーザーレビューを待つ。

## JUDGE-021: 新規Project名を自動採番する

- 状態: 決定（2026-07-23）・local実装／component test確認済み。
- 既定名: 新規作成panelを開いた時、保存済みProject数に応じて`新しい曲 1`、`新しい曲 2`…を曲名欄へ設定する。
- 編集性: 既定名はplaceholderではなく実際のProject名候補とするが、通常の入力欄として自由に上書きできる。
- Scope: 既存Projectの名前、autosave、削除、番号の詰め直しは変更しない。
