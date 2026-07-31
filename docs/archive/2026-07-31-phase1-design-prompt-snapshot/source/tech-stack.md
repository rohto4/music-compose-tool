# Tech Stack

## 採用済み

- OS・標準shell: Windows / PowerShell
- 文書・設定: UTF-8 Markdown / JSON
- 初期検証: local-only、fake-first、外部writeなし
- 初期デザイン比較: 同一要件・同一仮データによる2案比較
- 配布surface: Web / PWA
- 初版network方針: offline対応は必須にしない
- 初版content: instrumental / BGM。vocal / lyricsは非対象
- AI integration strategy: capability別の部分採用。model unavailable時もtemplate / rule / asset engineで主要workflowを継続する。
- heavy inference topology: user-managed home RTX 5080 server。smartphone / PWAはheavy generationなしでも編集・非AI workflowを継続する。
- GPU budget: 1 processのpeak reserved VRAMを10,240MiB以下に制限。ACE-Step DiT-onlyはtext2music 7,504MiB、source / reference条件付き`complete` 9,624MiBの実測で許可し、保守値を9,624MiBとする。DiT + 1.7B LMは実測14,128MiBで禁止。
- first fake vertical slice language / UI: TypeScript `strict` + React 19.2系。
- build / package: Vite + npm + `package-lock.json`。exact dependencyはscaffold時に固定する。
- verification: Vitestのdomain / contract testとPlaywrightのChromium / Firefox / WebKit browser journey。
- PWA開始境界: Web App Manifestから始め、service worker / offline cacheは初版保証に含めない。
- prototype realtime preview: user gesture後のWeb Audio `AudioContext` + oscillator / gainによるlocal内蔵シンセ。timeline再生に加え、asset group別の短いsample phraseを1 tapで試聴する。実音源scheduler / mix engineの採用完了とはみなさない。
- prototype precision editor: PPQ 480のwhole-song note data + high-DPI Canvas 2D main-thread描画 + viewport culling + Pointer Events / pointer capture。DOMはtoolbar、property editor、keyboard / screen reader代替操作へ限定する。
- production scaffold exact: React / React DOM 19.2.7、TypeScript 6.0.3、Vite 8.1.5、`@vitejs/plugin-react` 6.0.3、Vitest 4.1.10、Playwright 1.61.1、ESLint 10.7.0。`package-lock.json`を正本とする。
- production browser adapters: `idb` 8.0.3、JSZip 3.10.1、`@spotify/basic-pitch` 1.0.1。Basic PitchのApache-2.0 licenseとpackage内modelを確認済み。
- production project contract: `formatVersion 1.0.0`、PPQ 480、Project / Track / main-sub Lane / Note / Automation / Humming Take / Generation CandidateをTypeScript domainと`docs/spec/schema/v1/project-manifest.schema.json`で固定する。Phase 0 `0.1.0` fixtureは明示migrationだけで読み込む。
- production project storage: IndexedDB database `patchtone-projects`へ明示Save時だけfull Projectを保存する。`.mctproj`はJSZipの`bundle.json` + `project.json`をbaselineとし、256MiB上限、CRC、bundle / project identity、production schemaを読込時に検査する。dirty時だけ`beforeunload`を有効にし、autosaveは行わない。
- production audio engine: pure `AudioEventPlan`をWeb Audio adapterでscheduleし、oscillator / noiseからbuilt-in chord、drum、bass、lead、synth、pad、arp、percussion、FX、transitionを鳴らす。user gestureで`AudioContext`を作成し、停止時はactive sourceを全停止する。
- user audio library: WAV / MP3は128MiB、10分、mono / stereo、8–192kHzを上限とし、extension / RIFF-WAVEまたはMP3 header / browser decode / SHA-256を検査する。原音Blobとprivate metadataは`patchtone-audio-assets` IndexedDBへ明示import時に保存する。
- production arrangement: section add / update / remove / reorderとmusic block add / update / removeをProject command historyへ通す。HTML drag eventとkeyboard到達可能な前後buttonを併設し、section-bound blockは`parentBlockId`で追従・削除する。track role色はblock / lane、section roleはneutral frame shapeへ割り当てる。
- symbolic accompaniment baseline: key内diatonic chord候補を小節単位でscoreし、melody pitch classを含む候補を優先するdeterministic harmonizerを採用する。melody laneは変更せず、Chord / Bass / Drum / Pad / Arp / Synthのgenerated noteをMain / Sub laneへ原子的に書く。AI unavailable時の常設fallbackとする。
- AI Starter baseline: 新規Projectにeditable starter melodyとsymbolic accompanimentを作り、実際のrouteをGeneration Candidateへ記録する。local first sliceはTemplate Harmonizerを明示fallbackとして使い、Home AI / future symbolic modelと同じProject contractへ収束させる。patternによる部分上書きは被覆tick範囲だけに適用する。
- built-in timbre library: Web Audio oscillator / noiseの複数layer、detune、octave、gain、filter、ADSR、stereo spreadをversioned synthesis profileとして役割別preset bankにする。外部sampleを使わず、profile差をunit testで固定する。
- interaction feedback: CSS `:hover` / `:focus-visible`、Pointer Events、drag state class / ARIAを使い、hover lift、grabbed、drop targetを区別する。`prefers-reduced-motion`を尊重する。
- production humming capture: secure-context `getUserMedia` + `MediaRecorder`でmonoを要求し、echo cancellation / noise suppression / auto gain off、最大30秒、runtime MIME選択、stop時の全track解放を行う。機器が要求を無視してstereoを返す場合も、decode境界で全channelを平均してPCM16 mono WAVへ自動正規化する。raw takeは`patchtone-humming-takes` IndexedDBへ明示録音 / import時だけ保存する。
- production humming transcription: `@spotify/basic-pitch` 1.0.1をdynamic importし、package同梱modelを`public/models/basic-pitch`へ同期する。22,050Hz `AudioContext`でdecodeし、解析直前にも1ch `AudioBuffer`を保証してPPQ 480 noteへ変換する。pitch / timingをlockしたtake候補とMelody laneをProjectに保持する。
- local AI gateway: `tools/home-ai-gateway.mjs`をloopback `127.0.0.1:17321`へbindし、health・非同期job・artifactを提供する。GPU concurrency 1、queue 4、ACE-Step DiT-only allowlist、peak reserved VRAM 10,240MiB hard cap、未接続時のeditable Template / Rule fallbackを固定する。browser clientは`src/adapters/ai/home-ai-gateway.ts`から利用する。
- pattern-first harmony engine: 4/4の1小節を`4 * PPQ = 1,920 tick`とし、version付きchord / pattern identityを既存`MusicBlock`へ保持する。blockをsymbolic source、Web Audio再生とMIDI exportでmaterializeするnoteをderived dataとし、detail編集時だけmanual `NoteEvent`へ展開する。
- chord-pad audition: timeline全体の再生を経由せず、選択中のchord track `instrumentId`とsynthesis profileを使う専用`AudioEventPlan`をuser gestureから起動する。
- chord voice deck / sound bank: `BUILT_IN_AUDIO_ASSETS` 136件のうちsynthesis profileを持つ60 tonal assetを、元categoryを保持したままChord trackのinstrumentとして選択可能にする。Harp / Pizzicato / Music Box / Chorus、Drum 20、Percussion 8、FX 24、Transition 24を含み、asset複製や別音源downloadは行わない。
- editable song starter: licenseをpiece単位で確認したpublic-domain / redistributable scoreを、専用録音audioではなく通常のProject / Track / Lane / NoteEvent / MusicBlock / ArrangementSectionへatomic commandで展開する。source URL、license、attributionをcatalog dataへ保持する。
- titleless-ready workspace: 視覚見出しとaccessible nameを分離し、tab、時間方向、接続、現在値、操作結果だけで役割が自明なsectionは表示titleを段階的に外す。status、error、license、操作結果は省略しない。
- DAW piano keyboard scale: A0〜C8の88鍵をCanvasと共通の18px row heightで描き、white / black / octave-CをDOM classへ分類する。鍵盤とCanvasを共通の縦viewportへ入れ、non-passive wheel listenerで縦deltaだけを`scrollTop`へ渡す。鍵盤はpitch目盛りとして`aria-hidden`を維持し、Canvasを既存の編集surfaceとする。
- phrase chord sequence: 4 / 8 stepとも1 phraseを`16 * PPQ = 7,680 tick`へ固定し、8分音符単位でAUTO配分する。4小節phraseは上限なく連結し、block IDへphrase / slotを含め、全曲loop endをphrase数から算出する。assetId v1と既存1小節blockの後方互換を維持する。
- harmony-follow role patterns: Bass / Arp各10種、Drum 22種をProject外のversioned catalogと決定論的generatorで定義し、`role-pattern|v1|role|pattern|phrase|note` IDの通常NoteEventへ展開する。phrase scoped commandは対象role Main laneの未編集generated noteだけを置換し、Bass / Arpをchord変更後に再生成する。旧patternのuser-edited noteは保持しても旧generatorを再有効化しない。Drum laneもStandard MIDI channel 10へ出力する。
- phrase kit / sound chunk: 4小節のKawaii伴奏recipeと24種類の加工済み発音recipeを、通常のMusicBlock / NoteEventへ決定論的に展開する。Phrase Kitは1 Project command、Sound Chunk insertは音色変更とnote追加を1 commandへまとめ、保存chunkはversion付きassetIdとしてProject内に保持する。
- pattern insertion / section layout: version付き`application/x-patchtone-insert-v1` payloadをChord、進行template、Phrase Kit、role pattern、内蔵asset、user audio、Sound Chunkで共有し、4小節phrase / stepの互換drop先だけへ通常Project commandとして適用する。section並べ替えは別MIMEに分離し、順序を`localStorage`へ保存してProject schemaへ含めない。
- chord audition session: pointerdownで選択中timbreの持続和音sessionを開始し、pointerup / pointercancel / lostpointercaptureで停止する。tap配置は1回だけ行い、keyboardは有限auditionへfallbackする。
- portable composition brief: Projectから人向けコード譜、ABC 2.1、Instrumental-only Markdown、versioned JSONを決定論的に生成する。Project bundleは既存`.mctproj`を維持し、外部AIへの自動投稿は行わない。
- production visual system: layoutを共有し、OKLCH tokenを`Dark Pastel Studio` / `Vanilla Pastel` / `Friendly Signal`の3 setへ切り替える。theme IDは`localStorage`だけへ保存し、Project schemaへ含めない。workspace tab、丸いsurface switch、pill voice selector、keycap chord node、timeline stepをsemantic shapeとして分ける。
- production workflow modes: React surface stateで`rough` / `customize`を切り替え、Project contractを分岐させない。roughは設計・コード・section・Prompt、customizeは既存Canvas DAWを担当する。
- DAW range edit: blank-pointer marquee、Shift additive selection、atomic `note/update-many`、共有制約delta、drag ghost / tick・semitone表示、pointer cancelをCanvas editorへ追加する。
- built-in timbre profile: oscillator layer、detune、gain / octave、filter、ADSR、stereo spread、role tagをdata化し、Bright Supersaw Stack / Glass Pluck / Soft Wide Padを最初のchord timbreとする。外部sample依存なしで差を検証する。

Stack decision: `docs/arch/web-application-stack.md`

## 候補

| 領域 | 候補 | 判断に必要な情報 |
| --- | --- | --- |
| audio engine hardening | Web Audio API production adapter | browser別遅延、mobile実機、large project scheduling、OfflineAudioContext render |
| project asset bundling | `.mctproj`内のuser audio / generated layer同梱 | asset hash、dedupe、256MiB上限の見直し、mobile file UX |
| full-track / accompaniment | ACE-Step 1.5 DiT-only via home inference gateway | MIT、Windows。text2musicは7,504MiB、source / reference条件付き`complete`は9,624MiBでpass。1.7B LM thinkingはVRAM cap超過で不採用 |
| melody-conditioned accompaniment | MusicGen Melody via optional local model gateway | 1.5B、16GB memory推奨、weights CC-BY-NC 4.0。personal prototype比較候補 |
| loop / FX generation | Stable Audio 3 Small-Music / Small-SFX via optional local model gateway | 433M、CPU、最大120秒、Community License、gated weights。実測未実施 |
| asset retrieval | CLAP via optional local model gateway | text / audio similarity、約618MB checkpoint。voice memo仕様とruntime未決 |
| symbolic browser generation | Magenta.js | MusicVAE / MelodyRNN等、Apache-2.0。model品質と保守性を要検証 |
| local music AI | browser WebGPU / WASM | model size、対応device、license、初回download、performance、入力意図への追従、structured / editable output |
| precision editor promotion | OffscreenCanvas worker -> WebGL 2 -> WebGPU | Canvas draw / interaction budget、visible primitive数、browser / device matrix、fallback、accessibility代替UI。新しさだけで昇格しない |
| home inference gateway | custom async job gateway + single GPU model manager | upstream APIを直接公開しない。queue、model warm / switch、job ownership、timeout、artifact ID、provenanceをfixture化 |
| secure relay | Cloudflare Access + Tunnel | outbound-only connection、interactive user auth、origin JWT validation、domain / account / live E2Eは未実施 |
| resilient media path | Worker + private R2 + Cloudflare Queues pull consumer | home server offline buffer、大きなupload、artifact受渡しが必要になった段階で採否判断 |
| voice / FX intent | 固定phraseのlocal parserまたはaudio reference adapter | voice memoがspeech、口真似、参考audioのどれか、privacy、最初のfake/fixture |
| uploaded asset | browser file import | supported format、license metadata、validation、project bundling、user-owned DAW assetのexport/import |

## Phase 0 candidate decisions

- canonical audio: WAV PCM。48kHz、mono / stereo、16-bit / 24-bit候補。
- microphone capture: secure-context `getUserMedia` + runtime recording format detection +
  `decodeAudioData`。収録containerをproject正本にしない。
- mix render: `OfflineAudioContext` -> AudioBuffer -> app-side WAV encoding。
- manual file save: Blob URL + anchor downloadをbaseline、`showSaveFilePicker`はprogressive enhancement。
- imported asset validation: extension / MIME / magic bytes / decode / size / hashの多層確認。
- asset license enforcement: render、public share、project bundle、AI processingを別permissionとして扱う。
- Studio One: raw Sound Set / sample / presetは直接importせず、明示bounceしたWAVを
  `user-owned-export`として扱う。exact content license不明ならprivate reference限定。

根拠: `docs/research/audio-asset-format-and-license-boundaries-2026-07-21.md`

## 未決定

- source directoryの最終component shape
- browser support matrixとWindows version
- project bundle内のaudio asset格納方式と将来schema migration方針。project JSONは`1.0.0`、manual save、command history undo / redoを採用済み
- WAV以外を初版import / exportへ含めるか、WAV size / duration上限
- humming-to-melody方式と公開local music modelの採否
- AI出力のrepresentation。flat audio、stem、MIDI / note event、chord / section plan等を、編集可能性と指示追従の観点で比較する。
- melody pitch / rhythmを優先編集できるnote / timing representationと、簡易editorの形。
- 実際に使う音源pack、BOOTH商品、Studio One Sound Setの個別規約。包括許諾とみなさない。
- Studio One user-owned exportのうち、render / public share / AI processingを許可できる具体的content。
- speech commandの要否と認識方式
- account、cloud sync、共有、公開の有無
- home inference gatewayのinstall / update / loopback security、Access / Tunnel contract、smartphone代替workflow

## 非採択

- Windows native / hybrid desktop: 初版はWeb / PWAを採用するため。
- offline-first: ユーザー要件では初版不要のため。
- autosave: manual saveを採用するため。
- SongGeneration 2のproduct組込み: official licenseがacademic / research / education限定でproductionを禁止するため。source比較だけに使う。

根拠が確定するまで、候補を採用済みとして扱わない。

Model landscapeと根拠: `docs/research/music-ai-model-landscape-2026-07-21.md`

精密editor描画調査: `docs/research/precision-music-editor-rendering-architecture-2026-07-21.md`
