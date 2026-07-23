# Music AI Model Landscape

*As of: 2026-07-21 | Scope: public / local-capable models for Web/PWA music composition | Confidence: source facts High, product fit Medium*

## Executive Summary

公開一次資料から、今回の用途に関係する代表的なmodel / system familyを14系統確認した。modelは十分に存在するが、次の全条件を1つで満たすものは確認できなかった。

- hummingを本人のmelodyとして高い追従度で採用する。
- melody pitch / rhythmをnote単位で編集可能に保つ。
- かわいいFuture Bass / Future Coreの伴奏・長尺曲・instrument / loop / FXを生成する。
- Windows localとsmartphone Web/PWAの両方で実用速度を出す。
- 初版だけでなく将来のproduction / commercial候補でも使いやすいlicenseを持つ。

したがって、**機能別の部分採用**を前提にする。最有力の組合せは次の通り。

1. humming transcription: `Spotify Basic Pitch TS`
2. full-track / accompaniment experiment: `ACE-Step 1.5`を第1候補、`MusicGen Melody`をhumming追従比較候補
3. loop / instrument-like sample / FX experiment: `Stable Audio 3 Small-Music / Small-SFX`
4. voice memo / textとassetの雰囲気matching: `CLAP`
5. 常設fallback: chord、arrangement flow、instrument、FX presetのtemplate / rule / asset engine

model採用可否にかかわらず、PWA本体はtemplate / rule engineだけでも曲を作れる必要がある。重いmodelはcapability adapterの後ろへ置き、modelがないdevice、license不適合、初回download未完了、推論失敗時には非AI workflowへ戻す。

## Product Fit Criteria

| Criterion | Priority | 理由 |
| --- | --- | --- |
| 本人のhummingへの追従 | P0 | 自作感の中心 |
| melody pitch / rhythmのstructured output | P0 | 最優先の手編集対象 |
| instrumental / BGM対応 | P0 | vocal / lyricsは初版非対象 |
| local実行 | P0 candidate | privacyと外部service依存を抑える |
| Windows対応 | P0 | primary desktop環境 |
| smartphone fallback | P0 | mobileでfull workflowが必要 |
| cute Future Bass / Future Core適合 | P0 test | model cardだけでは判定できない |
| license / production利用可能性 | P0 gate | 将来の配布とcommercial検討を妨げない |
| 部分再生成・inpainting | P1 | 本人の意図を残して直すため |
| browser direct inference | P1 | local companion導入負荷を減らす |

## Candidate Decision

| Priority | Candidate | 想定担当 | 現在判断 |
| --- | --- | --- | --- |
| A | Basic Pitch TS | hummingからMIDI / note event | 最初のfeasibility spike候補 |
| A | ACE-Step 1.5 | full draft、reference audio、repaint、伴奏候補 | Windows local companionの第1実験候補 |
| A | Stable Audio 3 Small-Music / Small-SFX | loop、FX、短い音素材、audio-to-audio | CPU local生成の第1実験候補 |
| B | MusicGen Melody | humming / melody条件付き伴奏の比較 | CC-BY-NC weightsを許容するpersonal prototype限定候補 |
| B | CLAP | text / audioからasset候補をranking | voice memoの意味確定後の実験候補 |
| B | Magenta.js | browser内のsymbolic melody / drum variation | model品質と保守性を確認するfallback候補 |
| C | Magenta RealTime 2 | live生成・text / audio prompt blending | Windowsはoffline Python候補。real-timeはApple Silicon中心 |
| C | MuseCoco / GETMusic | text / attributeからsymbolic MIDI | Linux・旧stackのため調査用 |
| Hold | DiffRhythm | 長尺instrumental / reference generation | audio-onlyでmelody編集性が低い |
| Hold | HeartMuLa | lyrics / tag条件のfull-song generation | instrumental-firstと不一致。reference controlはroadmap |
| Hold | YuE | lyrics-to-song | vocal / lyrics中心で初版非対象と不一致 |
| Reject for product | SongGeneration 2 | full-song / BGM / dual track | licenseがacademic / research / education限定でproduction禁止 |

`A`でも採用済みではない。音質、指示追従、VRAM / RAM、待ち時間、failure behaviorをfixtureで測定してから決める。

## Model Inventory: 14 Families

### 1. Spotify Basic Pitch / Basic Pitch TS

- 用途: audio-to-MIDI / note event transcription。pitch bendも出力する。
- fit: hummingからeditable melodyを作る目的へ最も直接的に合う。
- runtime: Python版はWindowsでONNXを使用可能。TypeScript版はAudioBufferを入力にし、browser demoも公開されている。
- output: MIDI、note event、pitch / timing。今回の最優先編集対象と一致する。
- license: Apache-2.0。
- limitation: 生成modelではない。単一instrumentで最もよく動くため、humming noise、音程の揺れ、無声音をfixtureで検証する。
- source: [Spotify Basic Pitch](https://github.com/spotify/basic-pitch), [Basic Pitch TS](https://github.com/spotify/basic-pitch-ts)

### 2. Magenta MT3

- 用途: multi-instrument audio transcription。
- fit: upload済みの複数instrument音源をsymbolic dataへ分解する将来候補。
- runtime: T5X中心でBasic Pitchより重く、browser向けではない。
- license: repositoryはApache-2.0。
- decision: monophonic hummingの初版には過剰。Basic Pitchで不足するときだけ比較する。
- source: [Magenta MT3](https://github.com/magenta/mt3)

### 3. ACE-Step 1.5

- 用途: text / reference audioから長尺music生成、cover、repaint、extract / lego等。
- fit: full draft、伴奏、部分再生成の有力候補。model cardはreference audio、prompt adherence、instrumentalを掲げる。
- runtime: official install guideではDiT-onlyが4GB VRAM以上、LM併用が6GB以上、core modelは約10GB disk。Windows、CUDA、Intel XPU、CPU fallbackを案内する。
- output: 主にstereo audio。melody note / MIDIを直接編集するmodelではない。
- license: codeとofficial model cardはMIT。
- uncertainty: hummingをmelodyとしてどこまで維持できるか、cute Future Bass / Coreのquality、author-reported speedをlocal fixtureで確認する必要がある。
- source: [ACE-Step 1.5 model card](https://huggingface.co/ACE-Step/Ace-Step1.5), [official install guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/INSTALL.md), [GPU compatibility](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/GPU_COMPATIBILITY.md)

### 4. Meta MusicGen Melody / AudioCraft

- 用途: text-to-musicとtext + melody-to-music。`musicgen-melody`はchromagram条件を受ける。
- fit: humming由来melodyを伴奏・音色へ反映できるか比較する候補。
- runtime: melody modelは1.5B、largeは3.3B。official docsはlocal GPUと16GB memoryを推奨する。
- output: audio。note-levelのstructured editingは別途必要。
- license: codeはMIT、released weightsはCC-BY-NC 4.0。
- decision: personal prototypeでは比較可能だが、将来commercial / productionの正本にはしにくい。
- source: [MusicGen documentation](https://github.com/facebookresearch/audiocraft/blob/main/docs/MUSICGEN.md), [AudioCraft repository and weight license](https://github.com/facebookresearch/audiocraft)

### 5. Stable Audio 3

- 用途: text-to-audio、audio-to-audio、inpainting、continuation、LoRA。
- variants: official repoはSmall-MusicとSmall-SFXを433M / CPU / 最大120秒、Mediumを1.4B / CUDA / 最大380秒として案内する。
- fit: loop、FX、短いinstrument-like sample、既存blockの局所修正に強い候補。Small-SFXとSmall-Musicを役割分離できる。
- output: 44.1kHz stereo audio。MIDI / note eventではない。
- license: codeはMIT、weightsはStability AI Community License。model取得は利用条件への同意が必要で、commercialは別条件。
- limitation: English prompt中心。smartphone browser直実行はofficial supportとして確認できない。
- decision: ACE-Stepと競合ではなく、短いasset / FX担当として部分採用を比較する。
- source: [Stable Audio 3 repository](https://github.com/Stability-AI/stable-audio-3), [Stable Audio 3 Medium model card](https://huggingface.co/stabilityai/stable-audio-3-medium), [model overview](https://github.com/Stability-AI/stable-audio-3/blob/main/docs/guides/model-overview.md)

### 6. Magenta RealTime 2

- 用途: streaming music generation、text / audio promptによるstyle blending、DAW plugin / embedded application。
- variants: `mrt2_small` 230M、`mrt2_base` 2.4B。
- runtime: real-time support tableはApple Silicon中心。official docsはNVIDIA GPUでのoffline inferenceも案内する。
- output: streaming audio。structured melody editorとは別component。
- license: code Apache-2.0、weights CC-BY-4.0。
- decision: Windows PWAの初版より、将来のlive preview / style morphing候補。
- source: [Magenta RealTime 2](https://github.com/magenta/magenta-realtime), [official model card](https://huggingface.co/google/magenta-realtime)

### 7. DiffRhythm

- 用途: text / reference audioからfull-length song、instrumental mode、editing / continuation。
- runtime: official READMEはbaseで最低8GB VRAMとWindows手順を示す。
- output: audio。
- license: codeとDiT weightsはApache-2.0。
- decision: instrumental生成の代替候補だが、hummingからeditable melodyという中心要件へのfitが弱い。
- source: [DiffRhythm](https://github.com/ASLP-lab/DiffRhythm)

### 8. Tencent SongGeneration 2

- 用途: full song、pure music、vocal、separated accompaniment、text / reference audio conditioning。
- model: official repoはv2-largeを4Bとして公開する。
- positive: pure BGMとaudio promptに対応する。
- blocking issue: official LICENSEはacademic / research / education目的だけを許可し、commercialまたはproduction利用を禁止する。
- decision: source studyと比較評価だけ。製品へ組み込まない。
- source: [SongGeneration repository](https://github.com/tencent-ailab/SongGeneration), [official license](https://raw.githubusercontent.com/tencent-ailab/SongGeneration/main/LICENSE)

### 9. YuE

- 用途: lyrics-to-songのfull-song generation。reference audioとaccompaniment trackも扱う。
- runtime: stage 1が7B、stage 2が1Bで、長尺推論は高負荷。
- license: repositoryはApache-2.0。
- decision: vocal / lyrics中心のため初版BGMと不一致。採用優先度は低い。
- source: [YuE](https://github.com/multimodal-art-projection/YuE)

### 10. HeartMuLa

- 用途: lyrics / tag条件のmusic generation。HeartCodecとHeartCLAPを含むfamily。
- released model: official repoは3B modelを公開し、Apache-2.0への更新を記録する。
- limitation: reference audio conditioningとfine-grained controlはroadmap上の未完項目。
- decision: current feature setはinstrumental-first、humming adherence、structured editingへ合わないため保留。
- source: [HeartMuLa official repository](https://github.com/HeartMuLa/heartlib)

### 11. Magenta.js

- 用途: browser内でMusicVAE、MelodyRNN、DrumsRNN、PerformanceRNN、ImprovRNNを推論するTypeScript library。
- fit: melody / drum variationのbrowser-native option。structured note sequenceを扱える。
- license: Apache-2.0。
- limitation: model familyは新しいaudio foundation modelより古く、cute Future Bass / Coreへの適合やcheckpoint保守性を検証する必要がある。
- decision: AIなしtemplate engineと組み合わせるsymbolic variation候補。
- source: [Magenta.js](https://github.com/magenta/magenta-js)

### 12. Microsoft Muzic: MuseCoco / GETMusic

- 用途: MuseCocoはtext / attribute-to-symbolic music、GETMusicはmulti-track symbolic generation。
- fit: tempo、key、instrument、emotion等を属性にし、MIDIとして編集可能な曲を作る研究候補。
- runtime: MuseCoco docsはLinux、Python 3.8、旧PyTorch stackを前提にする。
- license: repository codeはMIT。checkpointと派生dataの条件は採用前に個別確認する。
- decision: structured outputは魅力的だが、Windows/Web統合と保守性が弱く初版採用しない。
- source: [Microsoft Muzic](https://github.com/microsoft/muzic), [MuseCoco](https://github.com/microsoft/muzic/tree/main/musecoco)

### 13. LAION CLAP

- 用途: audioとtextを同じembedding spaceへ写し、classification / retrieval / similarity rankingを行う。生成modelではない。
- fit: 「きらきら」「広がる」等のtext、または参考audioに近いFX / instrument / loop assetをcatalogから探す補助候補。
- runtime: official Hugging Face checkpointは約618MB。browser direct supportは確認できないため、local companionまたはserver候補。
- license: selected Hugging Face model cardはApache-2.0。
- uncertainty: speech voice memoを意味理解する用途と、口真似・参考audioを音響類似で探す用途は別。voice input仕様確定後に評価する。
- source: [LAION CLAP](https://github.com/LAION-AI/CLAP), [official Hugging Face checkpoint](https://huggingface.co/laion/clap-htsat-unfused)

### 14. Magenta DDSP

- 用途: differentiable synthesizer / filterとneural networkを組み合わせたaudio generation、voice-to-instrument timbre transfer。
- fit: voice memoやhummingのtimbreを別instrument風へ変換する将来候補。
- license: Apache-2.0。
- limitation: 汎用的な多数の完成instrument packを即時生成するmodelではなく、pretrained timbreまたはtraining workflowが必要。
- decision: 初版の音源不足を直接解決するものではない。sound design phaseで再評価する。
- source: [Magenta DDSP](https://github.com/magenta/ddsp)

## Recommended Partial-Adoption Architecture

| Capability | AI candidate | Non-AI fallback | Failure behavior |
| --- | --- | --- | --- |
| humming to melody | Basic Pitch TS | DSP pitch tracker + quantize rule | recordingを保持し、manual correctionへ進む |
| chord | symbolic modelは必須にしない | key対応chord progression asset + rule | 候補を再表示する |
| arrangement flow | full-track modelは参考候補 | Intro / Build / Drop / Break / Outroのflow asset | 別flowへ差し替える |
| full draft / accompaniment | ACE-Step 1.5、MusicGen Melody | melody + chord + arrangement template render | template draftを返す |
| loop / FX / sample | Stable Audio 3 Small | licensed asset catalog + preset | asset catalogへ切り替える |
| vibe matching | CLAP | curated tags / filters / user choice | 選択式UIへ戻す |
| symbolic variation | Magenta.js | deterministic variation rules | original blockを保持する |

### Runtime boundary

- PWA本体: project data、melody note editing、template / rule engine、asset catalog、preview / render。
- browser-direct AI: Basic Pitch TS、条件が合えばMagenta.js。
- optional local model gateway: ACE-Step、Stable Audio 3、MusicGen、CLAP等のPython / native runtimeをcapability別adapterで公開する。
- smartphone: heavy local modelを前提にせず、template fallbackと保存済みAI候補の編集を保証する。
- future server inference: local model gatewayと同じcontractを使えるが、privacy、cost、account、abuse対策を別判断にする。

local model gatewayはWindows native applicationを正本にする意味ではないが、別runtimeのinstall負荷が発生する。PWA単体で成立するfallbackを残すことで、gateway未導入でも主要workflowを壊さない。

## Counterevidence and Uncertainty

- official model cardのquality、speed、prompt adherenceは開発元の主張を含む。今回、model downloadとlocal inferenceは行っていない。
- full-track audio modelは音質が高くても、melody note、chord、section、instrument stemをstructured dataで返さない場合が多い。生成音声だけを正本にすると最優先のpitch / rhythm編集と衝突する。
- browser直接実行を公式に確認できた中心候補はBasic Pitch TSとMagenta.jsであり、heavy full-track modelはlocal companionまたはserverが必要になる可能性が高い。
- Stable Audio 3は2026年5月、ACE-Step 1.5は2026年1月の新しいreleaseで、API、weight、runtime互換性が変化する可能性がある。
- 「かわいいFuture Bass / Future Core」の再現性はmodel cardでは判定できない。artist名の模倣を評価軸にせず、tempo、rhythm、sound palette、energy、section、textureへ分解したfixtureが必要。
- generated one-shot / loopと、全音域で一貫して演奏できるinstrument packは別物。後者を自動生成だけで十分に供給できるとは確認できなかった。

## Proposed Validation Order

model download、依存導入、GPU実行は別承認後に行う。

1. Basic Pitch TS: synthetic humming fixtureと本人の短い許可済みrecordingでnote / pitch / timing errorとcorrection時間を測る。
2. ACE-Step 1.5: 3つの同一creative briefとhumming referenceで、追従、instrumental率、部分repaint、生成時間、VRAMを測る。
3. Stable Audio 3 Small-Music / Small-SFX: 4〜8小節loop、transition FX、one-shotのBPM / key / prompt追従とseamless loop性を測る。
4. MusicGen Melody: ACE-Stepと同じhumming fixtureでmelody保持率を比較する。non-commercial weight boundaryを表示する。
5. CLAP: text、spoken description、口真似、参考audioを分け、curated asset top-k retrievalを測る。
6. model failure、unavailable、timeout、unsupported deviceではtemplate engineへ戻れることをfakeで先に検証する。

## Evidence Gaps

- user machineのGPU / RAM / diskと、target mobile device matrix。
- actual humming fixtureと、melody追従の合格threshold。
- cute Future Bass / Future Core向けの合法な評価assetと評価語彙。
- Stable Audio Community Licenseと各modelの将来commercial条件のlegal review。
- Studio One製品資産のexport / import、license、project file同梱可否。
- local model gatewayを利用者がinstallしてよいか、または将来server inferenceを許容するか。

## Method

- official GitHub repositories、official Hugging Face model cards、official license filesを一次資料として使用した。
- 検索snippetだけで採否を決めず、model card、README、install / hardware guide、license本文を確認した。
- modelの音質比較、runtime benchmark、genre fitは未実行として分離した。
- closed cloud servicesは、local-capable公開modelを先に調べる今回のscopeから除外した。
