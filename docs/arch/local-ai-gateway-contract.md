# Local AI gateway contract

## 目的

Web / PWAから自宅RTX 5080上の音楽生成へ接続するための、localhost限定の非同期境界を定義する。gatewayが利用できなくても、ブラウザ側のTemplate / Rule Engine（編集可能なsymbolic伴奏）で制作を継続する。

実装: [`tools/home-ai-gateway.mjs`](../../tools/home-ai-gateway.mjs)
ブラウザclient: [`src/adapters/ai/home-ai-gateway.ts`](../../src/adapters/ai/home-ai-gateway.ts)

## 起動

```powershell
npm run gateway
```

このcommandはTemplate / Rule fallback用。検証済みのlocal ACE-Step DiT-onlyを有効にして追加WAV layerを生成する場合は、既定の`C:\LLM`配置または下記環境変数を検査する専用launcherを使う。

```powershell
npm.cmd run gateway:ace
```

既定のbindは `127.0.0.1:17321`。`HOME_AI_HOST`、`HOME_AI_PORT`で変更できるが、public interfaceへbindしない。Vite開発serverの `/api/home-ai` proxyが `/api`へ転送する。

ACE-Stepを実行する場合だけ、次の環境変数を明示する。

- `HOME_AI_ENABLE_ACE_STEP=1`
- `HOME_AI_ACE_PYTHON`: 専用Python executable
- `HOME_AI_ACE_SCRIPT`: VRAM guard付きscript
- `HOME_AI_ACE_CHECKPOINTS`: model checkpoint directory
- `HOME_AI_ARTIFACT_ROOT`: 任意。生成artifactのlocal private directory

未設定時はACE-Stepを起動せず、symbolic fallbackを返す。環境変数・model path・secretはhealth、job、ログ、projectへ返さない。

## Endpoint

### `GET /api/health`

返却するのはcapability、model state、queue depth、VRAM上限だけ。modelのfilesystem pathは含めない。

```json
{
  "status": "ok",
  "model": {
    "state": "unloaded",
    "profile": "ace-step-1.5-dit-only",
    "capMiB": 10240,
    "measuredPeakReservedMiB": 9624
  },
  "queue": { "depth": 0, "running": null, "maxDepth": 4 }
}
```

### `POST /api/jobs`

`capability`は `accompaniment` または `full-track`。`profile`は実測済み `ace-step-1.5-dit-only` のみ受け付ける。`melodyNotes`は最大512音、`durationSeconds`は1–30秒、BPMは40–240に制限する。`Idempotency-Key`が同じ未完了／完了jobは再利用し、重複生成しない。

伴奏jobは、鼻歌noteを変更せず、Chord / Bass / Drumのeditable laneを作る。ACE-Stepを使わない場合の結果は `status: "fallback"` で、`result.output.melodyPreserved: true` を返す。flatな完成音声だけを正本にしない。

full-track jobでACE-Stepが有効な場合も、結果は非同期jobで返す。同期HTTPで長時間待たず、`GET /api/jobs/{jobId}`をpollする。

鼻歌takeが選択されている場合、browserはWebM等を22,050Hz PCM WAVへ正規化し、最大5MiBの一時base64 payloadとして`srcAudioBase64` / `srcAudioMimeType`を送る。文章指示に紐づくボイスメモ・参考音声も、同じ上限の`referenceAudioBase64` / `referenceAudioMimeType`として一時参照入力にできる。gatewayはjob専用ディレクトリへ一時書込みし、ACE-Stepの`complete` task（`src_audio` + `reference_audio` + accompaniment instruction）へ渡す。source/reference fileはjob終了時に削除し、job JSON・ログ・projectへbase64本文を返さない。sourceが無い場合は従来のtext2music追加レイヤーへfallbackする。

### `GET /api/jobs/{jobId}`

状態は `queued → running → succeeded | fallback | failed`。`failed`は `error.code` を返し、UIはTemplate / Rule Engineへ戻れる。

### `GET /api/artifacts/{artifactId}`

ACE-Stepが生成したWAVをopaque artifact IDで配信する。job JSONには絶対pathを含めず、artifactはlocal cacheへ保存する。

## VRAMとモデルライフサイクル

- 1 processのpeak reserved VRAM hard capは **10,240 MiB**。
- ACE-Step 1.5 DiT-onlyはtext2musicで7,504MiB、source / reference条件付き`complete`で9,624MiBを実測している。allowlistの保守値は **9,624 MiB**。
- 1.7B LM / thinking profile（14,128 MiB実測）は拒否し、再起動しない。
- queue concurrencyは1。状態は `unloaded → warming → busy → unloaded`。
- job完了／失敗時にmodel stateを `unloaded` とし、次のjobへGPUを占有し続けない。
- ACE-Step scriptがmetricsでpeak reservedを報告し、10,240 MiB超過または値欠落ならartifactを採用せず `vram-cap-exceeded` / `malformed-output` とする。

## 安全境界とfallback

- bindはloopback、CORSは既定でVite originだけ。
- request bodyは8MiB、queueは最大4件。超過時は正規化エラー `payload-too-large` / `queue-full`。
- source humming audioは5MiB、許可MIMEはWAV / MP3 / WebM / Ogg / MP4。公開APIへbindせず、source bytesはartifactとは別に保持しない。
- unsupported profile / capability、malformed JSON、invalid note、model timeout / OOM、artifact missingを個別error codeで返す。
- browserはgateway unavailable / timeout / fallbackでも、既存のdeterministic harmonizerと編集可能laneで作曲を完了できる。
- Cloudflare Tunnel、Access、router / firewall、credential、public deployはこのgateway起動では変更しない。
