# Audio Asset Format and License Boundaries

## 文書状態

`Primary-source research / 2026-07-21 / Phase 0 candidate decision`

法的助言ではない。初版のpersonal / non-commercial scopeで、誤って第三者assetを
project bundleやAI jobへ渡さないためのProduct境界を定義する。

## 結論

1. 初版のcanonical audio import / internal render / audio exportは
   `WAV PCM`へ絞る。編集用は48kHz、mono / stereo、16-bitまたは24-bit候補とする。
2. browser収録formatは固定しない。`MediaRecorder.isTypeSupported()`で実行時に確認し、
   取得Blobを`AudioBuffer`へdecodeしてcanonical PCMへ正規化する。
3. mix exportは`OfflineAudioContext`で`AudioBuffer`を作り、初版はapp側WAV encoderで
   downloadする。MP3 / AAC / FLACは互換性spike後の追加formatとする。
4. manual project saveはBlob URL + `<a download>`をbaselineとし、
   `showSaveFilePicker()`はprogressive enhancementに限定する。
5. Studio One / Fender Studio Pro資産は、installed Sound Set、raw sample、presetを
   Web appへ直接取り込まない。userがDAWで自分の制作物としてbounceしたWAVだけを
   `user-owned-export`としてprivate reference可能にする。
6. BOOTHはplatform購入を包括的な素材利用許諾とみなさない。商品・shopごとの規約を
   記録し、render、public share、project bundle、AI processingを別々に判定する。
7. ACE-Step 1.5はcode / modelがMITで、official model cardは生成曲のcommercial useを
   許すと説明している。ただしMIT文面はsoftwareの許諾であり、個々の生成物の
   third-party権利非侵害保証ではないため、provenanceを残しcommercial判定は別gateにする。

## Browser audio facts

### Microphone

- W3C Media Capture and Streamsでは`getUserMedia()`はsecure contextのAPIで、
  microphone permissionと明示的な利用表示が必要になる。
- browserの録音container / codecは一律ではない。MDNは
  `MediaRecorder.isTypeSupported()`を実行時確認に使い、trueでもresource不足等で
  recordingが失敗し得るとしている。
- `decodeAudioData()`はbrowserが対応するfileを`AudioBuffer`へdecodeする。
  したがって収録BlobのMIME値をprojectの長期contractへ固定せず、decode成功後の
  PCM representationを編集・pitch extractionの入口にする。
- custom real-time処理が必要な場合、`AudioWorklet`はmain thread外で処理できる。
  初期vertical sliceでは必須にせず、MediaRecorder + decode fixtureから始める。

Candidate capture pipeline:

```text
explicit user gesture
  -> getUserMedia({ audio: true })
  -> runtime codec choice
  -> short local recording
  -> decodeAudioData
  -> mono 48 kHz AudioBuffer
  -> humming transcription candidate
  -> user confirms editable notes
```

permission denied、device missing、unsupported MIME、empty / silent input、decode failure、
recording interruptionをnegative fixtureにする。microphone permission取得前にremoteへ
streamを送らない。

### Import

Initial allowlist candidate:

| Purpose | v0 format | Notes |
| --- | --- | --- |
| humming / voice memo | WAV PCM mono / stereo | 48kHzへnormalize。元hashを保持 |
| user loop / stem | WAV PCM mono / stereo | 44.1 / 48kHzを受け、内部48kHz候補 |
| symbolic melody | Standard MIDI File | note event import spike後に追加 |
| convenience audio | FLAC / MP3 / AAC | browser matrixとmetadata test後。v0必須にしない |

MDNのWeb audio codec guideではlossy音声を再mix / 再compressする場合は品質劣化が重なるため、
編集素材にはlosslessを優先する。FLACはdownload / storage候補として有力だが、browserでの
encodeは標準化された共通経路が弱い。WAVは大きい代わりに最初のfixtureを明確にできる。

Candidate limits（未採用値）:

- 1 file: 100MiB、10分、2 channelsまで。
- project参照: 64 assetsまで。
- extension、reported MIME、magic bytes、decode結果を照合する。
- original file nameは表示metadataだけに残し、storage keyにはcontent hash / generated IDを使う。
- decode前にsizeを確認し、remoteへ送る場合はserver側でも再検証する。

OWASPはextension allowlist、MIMEを信用しないこと、signature確認、generated filename、
size limit、webroot外storageを組み合わせるdefense-in-depthを推奨している。
HTML `accept`属性はfile pickerのhintでありvalidationではない。

### Mix render and download

- `OfflineAudioContext`はhardwareへ鳴らさず、可能な速さでgraphを`AudioBuffer`へrenderする。
- WebCodecsの2026年時点の案内ではaudio encodeはOpus / AACが中心で、MP3 encodeは主要browserに
  なく、FLAC encodeも標準共通経路にしにくい。
- 初版は`48kHz / 24-bit / stereo WAV`を品質export候補、
  `48kHz / 16-bit / stereo WAV`を軽量互換候補とする。
- `<a download>`とBlob URLは広く使えるbaselineで、Blob URLは利用後にrevokeする。
- `showSaveFilePicker()`はlimited availabilityかつsecure context限定なので、
  manual saveの唯一の経路にしない。

## Studio One / Fender Studio Pro boundary

### Confirmed from current official support

- Studio One Pro 7のreference manualはapp内で別途install・更新される。公開Web資料だけでは、
  userが所有する正確なversion / editionのexport format一覧を確定できなかった。
- current supportは、songを別PCへ移すとき、external filesをsong folderへ集める一方、
  `.soundset` contentは移動先にも同じSound Setのinstallが必要になるとしている。
- backup guidanceは、Studio One / third-partyのSound Set loopやsampleがsong folderへcopyされず
  referenceのままの場合があり、trackをbounceすれば音が欠落しにくいとしている。
- Impact XT kit share guidanceは、third-party sampleを許可なくpublic shareするのは
  intellectual property violationだと明記する。

### Product decision

Studio OneをWeb appのasset supplierとして自動scanしない。初版で認めるpathは次だけとする。

```text
user-owned Studio One project
  -> user explicitly bounces a phrase / stem
  -> WAV PCM file
  -> app imports as user-owned-export
  -> license evidence remains product / pack specific
  -> default: private reference only, no project bundle / public share / AI processing
```

`.soundset`、`.soundx`、plugin preset、instrument library、installed raw loopをimport対象にしない。
WAVへbounceした事実だけでは再配布許諾にならない。ユーザーが所有するStudio Oneのversion、
利用したSound Set / third-party pack、app内EULAの該当条文が確認できたassetだけ、effective policyを
緩和する。

## BOOTH boundary

BOOTH個別規約では、商品購入は購入者とshop ownerの二者間契約であり、登録商品とdownload商品の
流通・利用についてBOOTH運営は責任を負わない。よって「BOOTHで購入した」はlicense evidenceに
ならず、各商品ページ、同梱readme、shop共通規約が正本になる。

Import form candidate:

- source: BOOTH / other / own recording / DAW export / generated。
- item / shop URL。
- terms checked date、terms textまたはfileのSHA-256。
- private project use、derivative use、AI processing、rendered mix public share、raw bundle、
  commercial use、attributionの個別状態。
- unknownを選べる。unknownはprivate reference以外をfalseにする。

規約が後から変わり得るため、URLだけでなくimport時のsnapshot digestと確認日を残す。
規約本文そのものをproject bundleへ再配布するかは、その規約fileの再配布条件も確認する。

## Generated asset boundary

ACE-Step 1.5のofficial Hugging Face model cardはMIT表記で、commercial use可能な生成曲と
licensed / royalty-free / synthetic training dataを説明する。GitHubのLICENSEは通常のMITで、
softwareの利用・copy・modify・distribute等を許し、warrantyとnon-infringement warrantyを
否認する。

したがって生成assetは次を保存する。

- model ID / exact revision / local runtime version。
- seed、input asset IDs、prompt digest、requested constraints。
- reference audioのlicenseとAI processing permission。
- model card / license URLと確認日。
- generation time、output hash、human acceptance state。
- commercial useは初版`not-evaluated`。public share / bundleは生成物単体のpolicyとして別判定。

「MIT modelだから全生成物が無条件に安全」とは表示しない。特定artistや既存曲の模倣prompt、
近似性が高いoutput、permission不明なreference audioはreject / hold候補にする。

## Effective policy matrix

| Evidence state | Private reference | AI processing | Mix render | Public mix share | Raw project bundle |
| --- | --- | --- | --- | --- | --- |
| own humming / own recording | allow | allow by explicit consent | allow | allow by user choice | off by default for privacy |
| generated output with recorded provenance | allow | n/a | allow | review policy | review policy |
| BOOTH / purchased, explicit matching terms | allow | only if explicit | per terms | per terms | only if redistribution explicit |
| Studio One bounced, exact content terms unknown | allow | deny | deny / hold | deny | deny |
| unknown origin / unknown terms | quarantine | deny | deny | deny | deny |

## Schema impact

`asset-manifest`はlicense evidenceとeffective enforcementを分ける。

- evidence: `basis`、`licenseId`、`licenseTextUrl`、`termsDigest`、`recordedAt`、
  `redistribution`、`commercialUse`、`derivativeUse`、`aiProcessing`。
- enforcement: `renderAllowed`、`bundleAllowed`、`publicShareAllowed`、
  `aiProcessingAllowed`。

boolean enforcementをUIやjob gatewayで使い、license textの自然言語解釈を実行時に毎回行わない。
policy変更時はmanifest revisionを上げ、既存projectをsilentに緩和しない。

## Remaining user / external gates

- userが所有するStudio Oneのversion / editionと、実際に使いたいSound Set / third-party pack。
- app内EULAまたは購入時licenseの該当箇所。
- 実際に取り込みたいBOOTH音源の商品URLと同梱規約。
- browser support matrix（最低iOS Safari、Android Chrome、Windows Chrome / Edge候補）。
- WAV size limit、maximum duration、MIDI importを初版へ入れるか。

これらはprototypeとfake vertical sliceをblockしない。実asset importとpublic shareだけをblockする。

## Primary sources

- [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)
- [MDN MediaRecorder.isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)
- [MDN MediaRecorder mimeType](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType)
- [MDN decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
- [MDN AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet)
- [MDN OfflineAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext)
- [MDN Web audio codec guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs)
- [MDN WebCodecs codec selection](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection)
- [MDN showSaveFilePicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker)
- [MDN anchor download](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/download)
- [MDN URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static)
- [MDN accept attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [PreSonus: Studio One Pro 7 manual location](https://support.presonus.com/hc/en-us/articles/8768283634317--8-Studio-One-Pro-7-Where-Can-I-Find-the-Studio-One-Pro-7-Manual)
- [PreSonus: Moving Songs Between Computers](https://support.presonus.com/hc/en-us/articles/29973670961421-Studio-One-Pro-7-Moving-Songs-Between-Computers)
- [PreSonus: Back up song files](https://support.presonus.com/hc/en-us/articles/29974141726349-Studio-One-Pro-7-How-do-I-back-up-my-song-files-to-another-hard-drive-or-computer)
- [PreSonus: Sharing Impact XT Drum Kits](https://support.presonus.com/hc/en-us/articles/29973692703757-Studio-One-Pro-7-Sharing-Impact-XT-Drum-Kits)
- [BOOTH / pixiv service terms](https://booth.pm/terms)
- [ACE-Step 1.5 official model card](https://huggingface.co/ACE-Step/Ace-Step1.5)
- [ACE-Step 1.5 MIT license](https://github.com/ACE-Step/ACE-Step-1.5/blob/main/LICENSE)
