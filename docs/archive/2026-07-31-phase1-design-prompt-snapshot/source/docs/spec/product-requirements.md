# Product Requirements

## 文書状態

`Draft / core answers recorded`

ユーザー回答で確定していない内容は仮説として扱う。

- source template: `G:\devwork\tool-set\docs\setting\new-web-service-product-requirements-template.md`

## 採用済みProduct制約

- distribution surface: Web / PWA
- primary user: requesting owner
- content: instrumental / BGM
- smartphone scope: ラフ新規作成、Chord Pad長押し演奏、縦型コード譜、phrase / 拍数編集、試聴、Prompt共有。precision DAW全機能は要求しない
- save model: manual save、project file、undo / redo。autosaveとofflineは初版非対象

## Actor

| Actor | 状態 | 目的 |
| --- | --- | --- |
| Composer | 回答済み | 音楽理論や鍵盤演奏を前提にせず、耳でchord / patternを選んで短時間でBGMの基盤を作り、必要ならDAWへ持ち出す |

## 主要workflow候補

1. 新規project作成または先頭の「曲の設計」で、長さ・雰囲気・key・BPMをproject-wide条件として選ぶ。
2. `ラフ制作`で60 tonal voiceから音色を選び、押している間鳴るChord Padと全14コードのHarmonic Atlasから和音を耳で選ぶ。
3. 4 / 8 stepの各4小節phraseでコード長を8分音符単位に指定し、AUTO配分で合計16拍にする。4小節phraseは上限なく追加し、desktopは8小節／行、smartphoneは4小節／段のコード譜として読む。
4. Chord / Bass / Arp / Drumのrole別patternと、foreground / support等のinstrumentを差し替える。
5. 流れ・展開assetを選び、section間のenergyやtransitionを組み立てる。
6. 曲の設計・音の役割・section・コード譜からInstrumental-only Creative Briefを作り、text / ABC / Markdown / JSON / `.mctproj`へ出力する。
7. 必要なら`カスタマイズ`へ移り、矩形範囲選択と複数note移動を含むDAW-like editorでdetailを編集する。
8. manual saveし、project file、Standard MIDI、WAV / STEMSとしてexportしてStudio One等へ渡す。Humming Studioはexperimental workflowとして必要時だけ使う。

このworkflowは仮説であり、発見回答後に削除・統合できる。

## Capability候補

| ID | Capability | 状態 |
| --- | --- | --- |
| CAP-001 | かわいいFuture Bassの互換block set | ユーザー要件 |
| CAP-002 | かわいいFuture Coreの互換block set | ユーザー要件 |
| CAP-003 | コード / ドラム / ベース / リード / シンセ / パッド / アルペジオ / パーカッション / FX / transition等のset切替 | ユーザー要件・カテゴリ拡張回答済み |
| CAP-004 | `ラフ制作`で設計・コード・音色・section・Promptを組み、`カスタマイズ`で全曲note / track / mixerを精密編集する2段workflow | ユーザー要件・local実装／AI確認済み |
| CAP-005 | desktopとsmartphoneで新規作成・途中編集・試聴・共有 | ユーザー要件 |
| CAP-006 | section・開始小節・長さで範囲を選び、hummingの準備・録音・解析・音符候補の遷移を示し、その範囲へpitch / rhythm編集可能なmelody seedを差し込む | ユーザー要件・最優先編集対象・fake遷移作成済み |
| CAP-007 | manual save、project file保存・復元 | ユーザー要件・candidate contract / fixture作成済み |
| CAP-008 | audio export | ユーザー要件・WAV PCM 48kHz 16/24-bit candidate |
| CAP-009 | undo / redo | ユーザー要件・revision / dirty / command contract作成済み |
| CAP-010 | 曲の長さ・雰囲気・keyに応じたstructure / chord / asset推薦。chordは直接微調整より生成・候補選択・差し替えを優先 | ユーザー要件・clarified |
| CAP-011 | 公開music AIをcapability別に部分採用し、伴奏・加工・asset候補を補助 | feasibility candidate・landscape調査済み |
| CAP-012 | 生成assetとuser assetをimport | ユーザー要件・WAV / provenance / permission candidate boundary作成済み |
| CAP-013 | X / Misskeyのshare entrypoint | ユーザー希望・share仕様未決 |
| CAP-014 | BPM、key、tone、mix等へ必要時に到達し、chordは生成・候補選択・asset差し替えで変更 | ユーザー要件・clarified |
| CAP-015 | AIは曲作りの多くを担ってよいが、本人のhummingとイメージ指示を生成結果へ反映 | ユーザー要件・追従判定は未決 |
| CAP-016 | AI生成後もmelodyのpitch / rhythmを最優先で細かく編集 | ユーザー要件・優先対象確定 |
| CAP-017 | 初期flowを持つ曲構成と、Intro / Build / Drop / Break / Bridge / Outro templateの追加、流れ・展開の選択・交換・pointer drag並べ替え | ユーザー要件・prototype操作作成済み |
| CAP-018 | 生成またはuser-owned sourceから豊富なinstrument候補を利用 | ユーザー要件・generated / upload / bounce-only source policy candidate作成済み |
| CAP-019 | FX / mixの専門知識なしで、voice memoまたは選択式からFXの雰囲気を指定 | ユーザー要件・voice方式未決 |
| CAP-020 | model unavailable、unsupported、license不適合、timeout、failure時にtemplate / rule / asset workflowへ切替 | ユーザー要件・fallback方針確定 |
| CAP-021 | humming、full draft、loop / FX、asset retrievalごとにAI / non-AI担当を自動判定し、使用model / fallbackを表示 | ユーザー要件・同目的model pickerは不要 |
| CAP-022 | user-managed home RTX 5080 serverへheavy generation jobを送り、queue / model状態 / estimated wait / resultを扱う | ユーザー要件・Product topology決定 |
| CAP-023 | home AI unavailable時もsmartphoneで生成済み候補の編集とtemplate / rule / assetによる新規作成・試聴・保存・共有を継続 | ユーザー要件・fallback決定 |
| CAP-024 | audio書き出しを待たず、作曲中のtimelineをリアルタイム試聴 | ユーザー要件・Web Audio内蔵シンセprototype作成済み。実音源engine未検証 |
| CAP-025 | 複数projectを一覧し、新規projectを音のピースまたは鼻歌から開始 | ユーザー要件・in-memory prototype作成済み |
| CAP-026 | 各音のピースを1 click / tapで選択中asset種別に合う短いsample phraseとして即時試聴 | ユーザー要件・Web Audio内蔵音prototype作成済み。実sample未検証 |
| CAP-027 | 長さ・雰囲気・key・BPMを新規作成と「曲の設計」で管理し、asset推薦・互換性・展開長・再生tempoへ反映。AIには自動参照させ、AI固有prompt / reference /生成範囲と分離 | ユーザー要件・prototype操作作成済み |
| CAP-028 | 60分editorで全曲overview / zoom / scroll、note選択、縦横drag、右端resize、空白double click追加、Delete、duplicate、snap、quantize、velocity、undo / redo | ユーザー要件・Canvas 2D prototype操作作成済み |
| CAP-029 | Project Homeで「AIで土台を作る」「パッチボードで組む」「鼻歌から一曲」の3入口を提示し、Hummingはexperimental状態を明示 | ユーザー要件・production実装対象 |
| CAP-030 | Humming Studioで鼻歌、自然言語、mood、spoken memo、reference audioから伴奏・main instrument・展開・FX候補を一曲として作り、自然言語で再調整 | ユーザー要件・production実装対象 |
| CAP-031 | Humming StudioとPatchboard Workbenchが同じProject / Track / Lane / Audio Engineを共有し、生成結果をDAW-like editorへ送る | ユーザー要件・production Architecture |
| CAP-032 | 4/8個のprogression stepへchord padから進行を配置・置換し、各stepの拍数を変更してloop、undo / redo、save / reloadする | ユーザー要件・pattern-first primary workflow |
| CAP-033 | chord padを押したその場で、選択中のchord instrument / timbreにより和音を即時発音する。固定piano鍵盤やtimeline再生だけでは代替しない | ユーザー最低要件 |
| CAP-034 | chord候補を基本 / 彩り / 意外へ分け、key compatibility、voice-leading、noveltyを決定論的にscoreする | 競合比較後の採用Architecture |
| CAP-035 | harmony identityとperformance patternを分離し、Bass / Arp各10種、Drum 22種を4小節phraseへ試聴・適用する。Bass / ArpはChordへ追従し、手編集noteと他phraseを保護した通常NoteEventとしてdetail / MIDIへ渡す | 競合比較後の採用Architecture・local実装／AI proof済み・音楽品質review待ち |
| CAP-036 | Future Bass / Coreのforeground向け尖ったsaw / pluckとsupport向けsoft pad / subを音響profileで区別し、適合patternを提示する | ユーザー音色要件 |
| CAP-037 | Pattern Boardのharmony / role別noteをtempo付きStandard MIDI Format 1とWAV / STEMSへ出力し、Studio One handoffを可能にする | ユーザー要件・actual importはuser gate |
| CAP-038 | AI StarterはChord / Bass / Drum / Pad / Arp等の編集可能なsymbolic foundationを作り、実際のAI / rule fallbackを表示する。pad部分編集は未編集小節を保持する | ユーザー追加要件 |
| CAP-039 | AI Starter、Pattern Board、Humming Studioの3入口を同じProject / Track / Lane / NoteEventへ合流させ、どこからでも60分DAWとStandard MIDIへ進める | ユーザー追加要件 |
| CAP-040 | 内蔵音色を役割別の多数preset bankとして用意し、名称だけでなくlayer / envelope / filter / stereo等の音響profileを区別する | ユーザー追加要件 |
| CAP-041 | hover / focus / drag中の操作対象、grab状態、drop候補を浮き上がり、outline、shadow、cursor、補助文で明示し、reduced motionにも対応する | ユーザー追加要件 |
| CAP-042 | Chord Padで136音中の全60 tonal profileをChord / Synth / Pad / Lead / Arp / Bass familyから選び、選択音色で和音を即時発音する | ユーザー実操作feedback・local実装／AI確認済み |
| CAP-043 | 基本7コードをdegree順の主軸へ、彩り・意外コードを関連degreeの近くへ置き、全候補を隠さず1画面・1 tapで鳴らせるHarmonic Atlasを提供する | ユーザー実操作feedback |
| CAP-044 | 現在音色、音色family、進行step、各step拍数、コード属性が同じ画面・スクリーンショットで判別できる | ユーザー実操作feedback |
| CAP-045 | Patchboard / Humming Studio切替を左上の丸いcompact controlにし、active / inactiveを色以外でも示す | ユーザー実操作feedback |
| CAP-046 | 4 / 8 stepのどちらでも進行合計を16拍＝4小節へ固定し、拍数変更時は少なくとも1つのAUTO stepを画面に示して残り拍を自動配分する | ユーザー実操作feedback |
| CAP-047 | 4小節phraseを上限なく追加し、desktopは8小節／譜面行、smartphoneは4小節／段で、小節番号・コード・正確な長さを表示する | ユーザー追加要件・local実装／AI確認済み |
| CAP-048 | コード長を8分音符単位で指定し、付点4分を含める。三連符はChord Score surfaceへ含めない | ユーザー追加要件・local実装／AI確認済み |
| CAP-049 | Projectから人向けコード譜、ABC 2.1、Instrumental-only Markdown、構造化JSON、`.mctproj`をcopy / downloadする | ユーザー追加要件・local実装／AI確認済み |
| CAP-050 | smartphone Chord Padをpointerdownからreleaseまでsustainし、pointercancel / lost captureでもstuck noteを残さない | ユーザー追加要件・local実装／AI確認済み |
| CAP-051 | DAWで空白drag矩形選択、Shift追加、複数noteのatomic pitch / timing移動、ghost / delta、cancel、undo / redoを行う | ユーザー追加要件・local実装／AI確認済み |
| CAP-052 | 現行layoutを保ち、Dark Pastel Studio / Vanilla Pastel / Friendly Signalを切替・端末保存する | ユーザー追加要件・local実装／AI確認済み |
| CAP-053 | 定番コード進行を感情・用途と現在keyのコード名で比較し、任意の4小節phraseへ1 tapで適用する。適用後も曲全体のkeyを変更でき、手入力／鼻歌Melodyを黙って移調しない | ユーザー追加要件・local実装／AI確認済み |
| CAP-054 | 曲構成を左から右の時間レールとして表示し、末尾の空slotからsectionを追加する。drag、keyboard並べ替え、削除、Main / Sub配置を保持する | ユーザー追加要件・local実装／AI確認済み |
| CAP-055 | カスタマイズ上部からコード・伴奏込みの全曲を再生／停止し、明示track切替、補色note選択、viewport rail、responsive Mixer、FX単体試聴を提供する | ユーザー追加要件・local実装／AI確認済み |
| CAP-056 | 内蔵音を136 profileへ拡張し、60 tonal、Drum 20、Percussion 8、FX 24、Transition 24を用途と音響profileで区別する。試聴末尾へ選択外の高音motifを混ぜず、Drum kitはpatternと別に音響fingerprintを持つ | ユーザー追加要件・local実装／AI確認済み・聴感review待ち |
| CAP-057 | 目標時間、BPM、key、moodをコード記号、推定尺、展開候補、再生へ連動させ、ラフ制作の複数surfaceから同じArrangementを編集する | ユーザー追加要件・local実装／AI確認済み |
| CAP-058 | licenseをpiece単位で確認した既製曲starterを、録音audioではなく編集可能なMelody / Chords / Arrangementへ展開し、source / license / attributionと置換範囲を適用前に示す | ユーザー追加要件・最初の複数presetをlocal実装／AI確認済み |
| CAP-059 | 同義反復、飾りeyebrow、機能名の言い換えsubtitleを減らし、配置、接続、現在値、操作結果だけで役割が自明なsectionはaccessible nameを残して表示titleも外す | ユーザー追加要件・段階適用中／AI visual確認済み |
| CAP-060 | DAW左端をCanvasの18px行と揃ったA0〜C8の88鍵ピアノにし、白鍵、短い黒鍵、C音を区別する。初期表示をC6〜C3付近に保ち、wheelで上下移動して表示外pitchへ配置できる | ユーザー追加要件・local実装／AI visual確認済み |
| CAP-061 | Copy、移動、複製等の結果を全幅green bandで表示せずtitle横のcompact live statusへ置き、選択0件のCopyではstatusもclipboard更新も行わない | ユーザー追加要件・local実装／AI visual確認済み |
| CAP-062 | `音を組む`のコード譜／4小節挿入先を上部、Harmonic Atlas、その下へ挿入アイテム群を置き、コード、進行、伴奏phrase、role pattern、音のピース、複合FX / Fillをclickとdrag & dropの同一commandで挿入する | ユーザー追加要件・local実装／AI確認済み・操作review待ち |
| CAP-063 | `音を組む`の主要sectionを専用handleまたはkeyboard上下buttonで並べ替え、端末localStorageへ保存する。指定初期順へ戻せ、Project音楽dataへlayoutを混ぜない | ユーザー追加要件・local実装／AI確認済み・操作review待ち |
| CAP-064 | 新規Project作成panelを開いた時、保存済みProject数に応じて`新しい曲 1`、`新しい曲 2`…を編集可能な既定名として設定する | ユーザー追加要件・local実装／AI確認済み |

## 制作段階

- ラフ制作: コード譜、音色、pattern、section、Instrumental Promptまでを短時間で作り、外部生成AIまたはカスタマイズへ渡せる状態にする。
- カスタマイズ: 全曲を移動・拡大できるDAW-like editorでpitch、timing、length、velocity、track / mixerを編集し、MIDI / WAV / STEMSへ出す。

10 / 30 / 60分は速度の観測値として将来測定してよいが、別surface名や品質保証名には使わない。

## 非機能要件候補

- 最初のworkbenchをmarketing説明より先に表示する。
- メイン作曲画面へ大きなproduct title / subtitleを常時表示しない。必要なら開始画面へ分離し、project名はcompact controlとして扱う。
- 制作フェーズは作業部品として置き、固定headerへ常駐させない。
- interaction stateや開発用説明は常時表示せず、`?` help disclosureから到達できるようにする。
- touch target、keyboard focus、screen zoom、reduced motionを設計対象にする。
- 再生開始、block交換、試聴の体感遅延目標を実測で定義する。
- microphone未許可・未対応時にclickだけでhumming由来と同一結果へ到達することは要件にしない。permission拒否を説明し、他の編集機能を壊さない。
- mobile幅でdocument横scrollを主要操作の前提にしない。Chord Scoreは4小節／段を縦に積み、Chord Padの14候補を44px以上で表示する。
- Prompt / Creative Briefは常にinstrumental-only制約を含み、vocal / lyrics / spoken wordsを生成対象にしない。
- 3 themeは同じDOM layoutと音楽dataを共有し、色だけでactive / disabled / error / track roleを判別させない。
- offline対応とautosaveは初版要件にしない。
- saveは明示操作とし、未保存状態を利用者が認識できるようにする。
- AI候補は、本人のhumming・イメージ指示のどこが反映されたかを利用者が判断でき、重要箇所を編集可能な状態を保つ。具体的なrepresentationと合格基準は未決とする。
- 60分のmelody editorはwhole-song Canvas piano-rollを持ち、viewport cullingしながらpitch / timing drag、length resize、double-click add、velocity、duplicate、delete、quantizeと1/16T・1/32 gridを扱う。mix / masteringまで専門DAWと同等にする意味ではない。
- ラフ制作workspaceは曲の設計、音、展開を3 tabで切り替え、カスタマイズmodeは既存DAWを表示する。
- 長さ・雰囲気・key・BPMはproject-wide条件であり、persistent headerへ置かない。AI固有の文章指示、参考音、生成範囲はAI panelへ置き、project条件はread-only summaryとして自動参照させる。
- CanvasはCSS sizeと`devicePixelRatio`にbacking storeを合わせ、全曲noteのうちviewportと交差するnoteだけをdraw / hit-testする。描画とaudio schedulingを同じanimation frameへ結合しない。
- 展開sectionの色分けは行わず、neutralな枠形状とlabelで役割を区別する。role colorはtrackと音のピースの対応へ使う。
- sample auditionは音のピース内の1 click / tapで開始し、別画面、書き出し、複数stepを要求しない。
- main画面の説明用subtitleやprototype copyは常時表示せず、実状態label、tooltip、`?` help、screen reader textへ分離する。
- heavy local modelを使えないsmartphoneでも、新規作成、編集、試聴、共有のworkflowをtemplate / rule / asset engineで完了できる。
- home inferenceはasync jobとし、model warm-upや長尺生成を単一の同期HTTP responseで待たない。server unavailable、queue full、timeoutをproject編集から分離する。
- home inferenceの1 process peak reserved VRAMは10,240MiB以下をhard capとし、実測済みallowlist profileだけを起動する。GPUを占有して他作業を妨げるprofileは品質にかかわらず不採用とする。
- AI生成audioを唯一のproject正本にせず、melody note、chord asset、arrangement asset、source metadataを保持する。

## 非対象候補

- 専門DAWと同等のmixing/mastering機能。
- 初版でのMPE、plugin editor。copy / pasteと高度な範囲loopは次段候補とする。矩形複数選択と一括移動は採用済み。
- chord理論を前提とする直接的なfine editorを最初のvertical sliceの必須機能にすること。
- 最初のversionでの全音楽genre対応。
- Windows native application。
- vocal / lyrics生成。
- commercial versionと商用利用制御。
- tone / sound自作機能。
- autosaveとoffline対応。

非対象はユーザー確認前の候補。

## 受入条件の未決

- 曲として成立したと判断する条件。
- block間のkey/BPM/section互換性。
- crash recoveryとmanual save時の未保存警告。
- audio / project export formatとMisskey share仕様。
- browser/device matrixとmobile performance。
- Web Audio realtime previewのiOS WebKit / Android Chrome / Windows Edge、latency、scheduling、実asset mix。現在はChromeの内蔵oscillator prototypeだけを確認済み。
- local music AIのmodel、license、計算資源。ACE-Step 1.5の10秒Windows fixtureはpassしたが、humming追従、長尺、subjective genre fitは未決。
- home RTX 5080 gatewayとWeb / PWAの接続方式。Cloudflare Access + Tunnelは候補で、live E2E未実施。
- user assetのlicense metadata、project同梱、share時の再配布境界。
- humming・イメージ指示が生成結果へ採用されたと判断する観測可能な基準。
- melody pitch / rhythmに続く2番目の優先対象。現時点のDAW-like編集P0はselection、drag、resize、add、delete、snap、quantize、velocity、zoom / scrollとし、P1以降の順序は実使用で見直す。
- arrangement assetのcandidate schemaを実編集で採用できるか。section flow、energy curve、transitionの構造自体はfixture化済み。
- FXのvoice memoがspeech、口真似、参考audioのどれか。
- Studio One製品資産を含む個別contentのlicense確認。初期formatはbounce WAV、unknown termsはprivate reference限定のcandidate boundaryを定義済み。
- Basic Pitch TS、ACE-Step 1.5、Stable Audio 3、MusicGen Melody、CLAPのfixture別quality、latency、resource、failure測定。
- optional local model gatewayの配布負荷を許容するか、将来server inferenceを使うか。
