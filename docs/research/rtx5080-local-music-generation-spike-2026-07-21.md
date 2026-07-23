# RTX 5080 Local Music Generation Spike

## 結論

- ACE-Step 1.5のWindows local generationは、このPCのRTX 5080 16GBで実行できた。
- 10秒のinstrumental fixtureは、DiT-onlyで1.735秒、1.7B LMの`thinking`付きで8.496秒だった。model warm-upはそれぞれ5.146秒、DiT 5.080秒 + LM 19.841秒。
- DiT-onlyのpeak reserved VRAMは7,504MiB、DiT + 1.7B LMは14,128MiB。後者は実行には成功したが、ユーザー指定の10,240MiB hard capを超えるため不採用・再実行禁止とした。
- 最初のserver方針はsingle GPU worker、FIFO job queue、実測10,240MiB以下のallowlist profileだけを起動する。現時点のallowlistはACE-Step DiT-onlyだけ。
- これは実行可能性のpassであり、かわいいFuture Bass / Future Coreとしての主観品質、humming追従、melody編集可能性の合格ではない。

## 承認・境界

2026-07-21のユーザー明示承認により、次を実施した。

- Codex以外の確認済みAI runtime停止。
- dependency導入、約10GB model取得、RTX 5080実行。
- local-only fixture生成。

実施していないもの:

- Cloudflare resource、domain、Tunnel、Access、Worker、R2、Queueの作成。
- router / firewall変更、port forward、public deploy、secret登録。
- gated model、追加model、BOOTH / Studio One assetの取得。

## Environment evidence

| Item | Observed |
| --- | --- |
| GPU | NVIDIA GeForce RTX 5080 |
| VRAM | 16,303MiB reported by `nvidia-smi` |
| Compute capability | 12.0 / `sm_120` |
| Driver | 596.21 |
| Driver CUDA compatibility | 13.2 reported by `nvidia-smi` |
| Runtime | Python 3.12.13 / PyTorch 2.7.1+cu128 / CUDA runtime 12.8 |
| PyTorch architecture list | `sm_120`を含む |
| model source commit | ACE-Step source `6d467e4b5081ccb0abf1ec1bf4fdf9051a2d34b0` |
| model revision | Hugging Face `19671f406d603126926c1b7e2adc169acbcade22` |
| dependency environment | `C:\LLM\tools\ACE-Step-1.5\.venv`, 6.03GiB |
| model directory | `C:\LLM\models\music\ace-step-1.5`, 10,092,107,829 bytes / 9.399GiB / 57 files |

NVIDIAのofficial RTX 5080 pageもstandard memoryを16GB GDDR7としている。

## Process stop evidence

`ollama ps`は空で、GPU compute中のOllama modelはなかった。競合を避けるため、確認できた次だけを停止した。

| PID | Process | Result |
| --- | --- | --- |
| 9196 | `ollama.exe` | stopped |
| 22292 | `ollama app.exe` | stopped |

Codex / ChatGPT、browser、Windows UI等は停止していない。Ollama modelが未ロードだったため、停止による大きなVRAM回収はなかった。Ollamaは通常起動で復旧できる。

## Model integrity evidence

| Component | Size | SHA-256 |
| --- | ---: | --- |
| `acestep-v15-turbo/model.safetensors` | 4.459GiB | `3f6e0797fad420a39bd33979eb6e840e30989e34a3794e843d23b60ec6e422d7` |
| `acestep-5Hz-lm-1.7B/model.safetensors` | 3.454GiB | `f161689da73e5ecefa28ff780d51c2d92a00f056d021d7933c779ed5c6cd7db8` |
| `Qwen3-Embedding-0.6B/model.safetensors` | 1.110GiB | `0437e45c94563b09e13cb7a64478fc406947a93cb34a7e05870fc8dcd48e23fd` |
| `vae/diffusion_pytorch_model.safetensors` | 0.314GiB | `da17edb604c40deaf09e9b24974e590d1ca83a374070e5d0884cfa4bed9a99b0` |

## Fixture

共通条件:

- prompt: `Cute future bass instrumental BGM with bright sparkling plucks, warm sidechained supersaw chords, playful chiptune accents, crisp punchy drums, a memorable optimistic lead melody, and a polished energetic drop; no vocals.`
- lyrics marker: `[instrumental]`
- BPM 155、D Major、4/4、10秒、seed 424242、batch 1、WAV 48kHz stereo。
- runner: `scripts/spike_ace_step_generate.py`

| Metric | DiT-only | DiT + 1.7B LM thinking |
| --- | ---: | ---: |
| DiT init | 5.146s | 5.080s |
| LM init | - | 19.841s |
| generation | 1.735s | 8.496s |
| total | 6.884s | 33.421s |
| memory after init allocated | 6,033.13MiB | 9,569.83MiB |
| memory after init reserved | 7,488MiB | 14,078MiB |
| peak allocated | 7,462.94MiB | 13,954.96MiB |
| peak reserved | 7,504MiB | 14,128MiB |
| output SHA-256 | `f98607e29b180438eebfbbfce145a133dfa12a1291e26018779427a20a2c74d5` | `b26036bb4933770ef42e1e239fdcb775456f5b0b81d294db63a490d54e12f103` |

両WAVとも10.0秒、48kHz stereo float WAV、peak 0.891251、non-finite sample 0、near-clipping sample ratio 0だった。RMSはDiT-only -22.171dBFS、thinking -22.208dBFS。

## Upstream API finding

official REST API wrapperはasync job contractを持つが、2026-07-21時点のsourceではstartup pre-checkがshared `ACESTEP_CHECKPOINTS_DIR`ではなくrepo内`checkpoints`を先に参照し、modelを重複downloadし始めた。

- API process PID 45972を停止。
- 誤って作られた1.724GiBの未完了duplicate `C:\LLM\tools\ACE-Step-1.5\checkpoints`だけをpath確認後に削除。
- 正式なshared model directoryは無傷。
- spikeはofficial `AceStepHandler` / `generate_music` pipelineの直接呼出しへ切り替えた。

Product serverではupstream APIを直接公開せず、download済みmodelを検証してから呼ぶ薄いgatewayを置く。upstream更新後にこのpre-check差異を再確認する。

## Resident / switch判断

| Capability | Initial placement | Residency |
| --- | --- | --- |
| humming transcription | Basic Pitch TS browser candidate | GPU serverへ常駐させない |
| ACE-Step DiT | home RTX 5080 worker | peak reserved 7,504MiBでallowlist。active session中はwarm候補 |
| ACE-Step 1.7B LM | disk上に保持するだけ | DiT併用14,128MiBのため起動禁止・再実行しない |
| CLAP retrieval | CPUまたはheavy jobのない時間 | ACE-StepとのGPU同時常駐を前提にしない |
| Stable Audio / MusicGen | future exclusive job class | 10,240MiB以下の安全な実測profileができるまで起動しない |

VRAM capはmodel file sizeではなく、processの`torch.cuda.max_memory_reserved()`実測で判定する。未知profileはallowlistへ入れず、1.7B LMの成功結果も採用根拠には使わない。

## User VRAM budget decision

2026-07-21の追加判断:

- 他作業ができなくなることを避けるため、peak reserved 14GB級の構成は使わない。
- 上限は約10GB、実装値は10,240MiB / process。
- fixture runnerから1.7B LM / `thinking`起動経路を削除し、DiT-only実行後にもcapを検査する。
- 1.7B model weightと過去の検証WAVはevidenceとしてdiskに残すが、runtimeから参照しない。

## Warning / limitation

- `torchao 0.16.0`はPyTorch 2.7.1とのC++ extension互換warningを出した。quantizationは無効で、今回の非量子化生成には影響しなかった。
- Python 3.12 Windowsではflash-attentionを使わずSDPAで成功した。
- 10秒fixtureだけで、長尺時のVRAM、thermal、concurrency、timeoutは未測定。
- 音を人が聴いてgenre fit、可愛さ、vocal混入、melody品質を判断するacceptanceが必要。
- humming reference、repaint、stem、partial editは未検証。

## Official sources

- [NVIDIA GeForce RTX 5080](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/)
- [ACE-Step 1.5 repository](https://github.com/ace-step/ACE-Step-1.5)
- [ACE-Step 1.5 installation guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/INSTALL.md)
- [ACE-Step API documentation](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/API.md)
- [ACE-Step model card](https://huggingface.co/ACE-Step/Ace-Step1.5)
