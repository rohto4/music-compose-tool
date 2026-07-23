"""Run a deterministic ACE-Step 1.5 instrumental or humming-conditioned fixture.

This is a Phase 0 feasibility harness, not application runtime code. It calls
the upstream pipeline directly so a shared checkpoint directory is never
downloaded a second time by the upstream REST API pre-check.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import time
from pathlib import Path


MAX_PEAK_RESERVED_MIB = 10_240.0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoints", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--duration", type=float, default=10.0)
    parser.add_argument("--bpm", type=int, default=155)
    parser.add_argument("--key-scale", default="D Major")
    parser.add_argument("--seed", type=int, default=424242)
    parser.add_argument("--task-type", choices=("text2music", "complete"), default="text2music")
    parser.add_argument("--src-audio", type=Path, default=None)
    parser.add_argument("--reference-audio", type=Path, default=None)
    parser.add_argument(
        "--instruction",
        default="Complete the input track with drums, bass, chords, pads, synths and FX while preserving the melody and rhythm.",
    )
    parser.add_argument(
        "--prompt",
        default=(
            "Cute future bass instrumental BGM with bright sparkling plucks, "
            "warm sidechained supersaw chords, playful chiptune accents, crisp "
            "punchy drums, a memorable optimistic lead melody, and a polished "
            "energetic drop; no vocals."
        ),
    )
    return parser.parse_args()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    args = parse_args()
    checkpoints = args.checkpoints.resolve()
    output_dir = args.output_dir.resolve()
    required = [
        checkpoints / "acestep-v15-turbo" / "model.safetensors",
        checkpoints / "vae" / "diffusion_pytorch_model.safetensors",
        checkpoints / "Qwen3-Embedding-0.6B" / "model.safetensors",
    ]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"Missing required checkpoints: {missing}")

    output_dir.mkdir(parents=True, exist_ok=True)
    os.environ["ACESTEP_CHECKPOINTS_DIR"] = str(checkpoints)
    os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")

    import soundfile as sf
    import torch
    from acestep.handler import AceStepHandler
    from acestep.inference import GenerationConfig, GenerationParams, generate_music
    from acestep.llm_inference import LLMHandler

    torch.cuda.reset_peak_memory_stats()
    started = time.perf_counter()
    handler = AceStepHandler()
    dit_init_started = time.perf_counter()
    status, initialized = handler.initialize_service(
        project_root=str(Path(__file__).resolve().parents[1]),
        config_path="acestep-v15-turbo",
        device="cuda",
        use_flash_attention=False,
        compile_model=False,
        offload_to_cpu=False,
        offload_dit_to_cpu=False,
    )
    dit_init_seconds = time.perf_counter() - dit_init_started
    if not initialized:
        raise RuntimeError(status)

    llm_handler = LLMHandler()
    lm_status = "not initialized (DiT-only fixture)"
    lm_init_seconds = 0.0

    memory_after_init = {
        "allocated_mib": round(torch.cuda.memory_allocated() / 1024**2, 2),
        "reserved_mib": round(torch.cuda.memory_reserved() / 1024**2, 2),
    }
    if memory_after_init["reserved_mib"] > MAX_PEAK_RESERVED_MIB:
        raise RuntimeError(
            "VRAM budget exceeded during initialization: "
            f"{memory_after_init['reserved_mib']} MiB > {MAX_PEAK_RESERVED_MIB} MiB"
        )
    params = GenerationParams(
        task_type=args.task_type,
        instruction=args.instruction,
        src_audio=str(args.src_audio.resolve()) if args.src_audio else None,
        reference_audio=str(args.reference_audio.resolve()) if args.reference_audio else None,
        caption=args.prompt,
        lyrics="[instrumental]",
        instrumental=True,
        bpm=args.bpm,
        keyscale=args.key_scale,
        timesignature="4",
        duration=args.duration,
        inference_steps=8,
        seed=args.seed,
        guidance_scale=7.0,
        thinking=False,
        use_cot_metas=False,
        use_cot_caption=False,
        use_cot_lyrics=False,
        use_cot_language=False,
    )
    config = GenerationConfig(
        batch_size=1,
        use_random_seed=False,
        seeds=[args.seed],
        audio_format="wav",
    )
    generation_started = time.perf_counter()
    result = generate_music(
        handler,
        llm_handler,
        params=params,
        config=config,
        save_dir=str(output_dir),
    )
    generation_seconds = time.perf_counter() - generation_started
    if not result.success:
        raise RuntimeError(result.status_message)

    peak_reserved_mib = round(torch.cuda.max_memory_reserved() / 1024**2, 2)
    if peak_reserved_mib > MAX_PEAK_RESERVED_MIB:
        raise RuntimeError(
            "VRAM budget exceeded during generation: "
            f"{peak_reserved_mib} MiB > {MAX_PEAK_RESERVED_MIB} MiB"
        )

    audio_paths = [Path(item["path"]).resolve() for item in result.audios]
    audio_evidence = []
    for audio_path in audio_paths:
        info = sf.info(str(audio_path))
        audio_evidence.append(
            {
                "path": str(audio_path),
                "bytes": audio_path.stat().st_size,
                "sha256": sha256(audio_path),
                "duration_seconds": round(info.duration, 3),
                "sample_rate": info.samplerate,
                "channels": info.channels,
                "format": info.format,
                "subtype": info.subtype,
            }
        )

    evidence = {
        "fixture": "ace-step-1.5-dit-only-cute-future-bass-v2",
        "mode": "dit-only",
        "task_type": args.task_type,
        "source_audio": str(args.src_audio.resolve()) if args.src_audio else None,
        "reference_audio": str(args.reference_audio.resolve()) if args.reference_audio else None,
        "instruction": args.instruction,
        "prompt": args.prompt,
        "lyrics": "[instrumental]",
        "bpm": args.bpm,
        "key_scale": args.key_scale,
        "requested_duration_seconds": args.duration,
        "seed": args.seed,
        "dit_init_seconds": round(dit_init_seconds, 3),
        "lm_init_seconds": round(lm_init_seconds, 3),
        "init_seconds": round(dit_init_seconds + lm_init_seconds, 3),
        "generation_seconds": round(generation_seconds, 3),
        "total_seconds": round(time.perf_counter() - started, 3),
        "device": torch.cuda.get_device_name(0),
        "compute_capability": list(torch.cuda.get_device_capability(0)),
        "torch": torch.__version__,
        "cuda_runtime": torch.version.cuda,
        "python": platform.python_version(),
        "memory_after_init": memory_after_init,
        "max_peak_reserved_mib": MAX_PEAK_RESERVED_MIB,
        "peak_allocated_mib": round(torch.cuda.max_memory_allocated() / 1024**2, 2),
        "peak_reserved_mib": peak_reserved_mib,
        "initialization_status": status,
        "lm_initialization_status": lm_status,
        "lm_model": None,
        "lm_backend": None,
        "lm_offload_to_cpu": None,
        "audio": audio_evidence,
    }
    metrics_path = output_dir / "metrics.json"
    metrics_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
    # PowerShell hosts may still expose cp932 to child processes. Escaping the
    # console copy keeps the harness exit status independent of status emojis;
    # metrics.json remains UTF-8 with readable Unicode.
    print(json.dumps(evidence, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
