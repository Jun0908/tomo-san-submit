from __future__ import annotations

import argparse
import asyncio
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import edge_tts


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_IMAGE = REPO_ROOT / "frontend" / "public" / "三浦jpg.jpg"
SADTALKER_ROOT = REPO_ROOT / "backend" / "vendor" / "SadTalker"
CHECKPOINT_DIR = SADTALKER_ROOT / "checkpoints"
DEFAULT_OUTPUT_ROOT = REPO_ROOT / "outputs"


if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Still photo -> talking head video generator powered by SadTalker."
    )
    parser.add_argument("--text", help="Speech text to synthesize before lip-sync.")
    parser.add_argument("--audio", help="Existing audio file to lip-sync against.")
    parser.add_argument(
        "--image",
        default=str(DEFAULT_IMAGE),
        help="Portrait image. Defaults to frontend/public/三浦jpg.jpg.",
    )
    parser.add_argument(
        "--voice",
        default="ja-JP-NanamiNeural",
        help="Edge TTS voice used when --text is set.",
    )
    parser.add_argument(
        "--rate",
        default="+0%",
        help="Edge TTS speaking rate. Example: +10%% or -15%%.",
    )
    parser.add_argument(
        "--voice-filter",
        default="",
        help="Filter for --list-voices, such as ja-JP or en-US.",
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="Print available Edge TTS voices and exit.",
    )
    parser.add_argument(
        "--size",
        type=int,
        choices=(256, 512),
        default=256,
        help="SadTalker render size. 512 is sharper but heavier.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1,
        help="SadTalker batch size. 1 is safest on 8GB GPUs.",
    )
    parser.add_argument(
        "--preprocess",
        choices=("crop", "extcrop", "resize", "full", "extfull"),
        default="crop",
        help="SadTalker preprocessing mode.",
    )
    parser.add_argument(
        "--pose-style",
        type=int,
        default=0,
        help="SadTalker pose style ID.",
    )
    parser.add_argument(
        "--expression-scale",
        type=float,
        default=1.0,
        help="Expression intensity multiplier.",
    )
    parser.add_argument(
        "--enhancer",
        choices=("none", "gfpgan", "RestoreFormer"),
        default="none",
        help="Optional face enhancer.",
    )
    parser.add_argument(
        "--still",
        action="store_true",
        help="Reduce head movement for a calmer talking photo.",
    )
    parser.add_argument(
        "--ref-eyeblink",
        help="Reference video path for blinking.",
    )
    parser.add_argument(
        "--ref-pose",
        help="Reference video path for head pose.",
    )
    parser.add_argument(
        "--cpu",
        action="store_true",
        help="Force CPU mode. Much slower than GPU.",
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_ROOT),
        help="Root directory for generated runs.",
    )
    return parser.parse_args()


def ensure_exists(path: Path, label: str) -> Path:
    if not path.exists():
        raise FileNotFoundError(f"{label} not found: {path}")
    return path.resolve()


def stage_input_file(source: Path, run_dir: Path, target_name: str) -> Path:
    staged = run_dir / target_name
    shutil.copy2(source, staged)
    return staged


def ensure_runtime() -> None:
    ensure_exists(SADTALKER_ROOT, "SadTalker root")
    ensure_exists(CHECKPOINT_DIR, "SadTalker checkpoints")
    required = (
        CHECKPOINT_DIR / "SadTalker_V0.0.2_256.safetensors",
        CHECKPOINT_DIR / "SadTalker_V0.0.2_512.safetensors",
        CHECKPOINT_DIR / "mapping_00109-model.pth.tar",
        CHECKPOINT_DIR / "mapping_00229-model.pth.tar",
    )
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise FileNotFoundError(
            "Required SadTalker weights are missing:\n" + "\n".join(missing)
        )


def find_generated_mp4(stdout: str, run_dir: Path) -> Path:
    match = re.findall(r"The generated video is named:\s*(.+?\.mp4)", stdout)
    if match:
        candidate = Path(match[-1].strip())
        if not candidate.is_absolute():
            candidate = (SADTALKER_ROOT / candidate).resolve()
        if candidate.exists():
            return candidate

    generated = sorted(run_dir.glob("*.mp4"), key=lambda path: path.stat().st_mtime)
    if not generated:
        raise RuntimeError("SadTalker finished without producing an mp4 file.")
    return generated[-1]


async def synthesize_text(text: str, voice: str, rate: str, output_path: Path) -> None:
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    await communicate.save(str(output_path))


async def fetch_voices(filter_text: str) -> list[dict[str, Any]]:
    voices = await edge_tts.list_voices()
    if not filter_text:
        return voices
    filter_text = filter_text.lower()
    return [
        voice
        for voice in voices
        if filter_text in voice["ShortName"].lower()
        or filter_text in voice["Locale"].lower()
    ]


def run_async(awaitable: Any) -> Any:
    return asyncio.run(awaitable)


def print_voices(filter_text: str) -> None:
    voices = run_async(fetch_voices(filter_text))
    if not voices:
        print("No voices matched the filter.")
        return

    for voice in voices:
        print(
            f"{voice['ShortName']}\t{voice['Locale']}\t"
            f"{voice.get('Gender', 'Unknown')}\t{voice.get('FriendlyName', '')}"
        )


def build_inference_command(
    args: argparse.Namespace,
    image_path: Path,
    audio_path: Path,
    run_dir: Path,
    ref_eyeblink_path: Optional[Path],
    ref_pose_path: Optional[Path],
) -> list[str]:
    command = [
        sys.executable,
        str(SADTALKER_ROOT / "inference.py"),
        "--driven_audio",
        str(audio_path),
        "--source_image",
        str(image_path),
        "--checkpoint_dir",
        str(CHECKPOINT_DIR),
        "--result_dir",
        str(run_dir),
        "--size",
        str(args.size),
        "--batch_size",
        str(args.batch_size),
        "--preprocess",
        args.preprocess,
        "--pose_style",
        str(args.pose_style),
        "--expression_scale",
        str(args.expression_scale),
    ]

    if args.enhancer != "none":
        command.extend(["--enhancer", args.enhancer])
    if args.still:
        command.append("--still")
    if ref_eyeblink_path:
        command.extend(["--ref_eyeblink", str(ref_eyeblink_path)])
    if ref_pose_path:
        command.extend(["--ref_pose", str(ref_pose_path)])
    if args.cpu:
        command.append("--cpu")

    return command


def main() -> int:
    args = parse_args()

    if args.list_voices:
        print_voices(args.voice_filter)
        return 0

    if bool(args.text) == bool(args.audio):
        raise SystemExit("Specify either --text or --audio.")

    ensure_runtime()

    image_path = ensure_exists(Path(args.image), "Image")
    ref_eyeblink_source = (
        ensure_exists(Path(args.ref_eyeblink), "Reference eyeblink video")
        if args.ref_eyeblink
        else None
    )
    ref_pose_source = (
        ensure_exists(Path(args.ref_pose), "Reference pose video")
        if args.ref_pose
        else None
    )

    output_root = Path(args.output_dir).resolve()
    run_name = datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir = output_root / run_name
    run_dir.mkdir(parents=True, exist_ok=True)

    staged_image_path = stage_input_file(image_path, run_dir, "source_image" + image_path.suffix.lower())
    staged_ref_eyeblink = (
        stage_input_file(ref_eyeblink_source, run_dir, "ref_eyeblink" + ref_eyeblink_source.suffix.lower())
        if ref_eyeblink_source
        else None
    )
    staged_ref_pose = (
        stage_input_file(ref_pose_source, run_dir, "ref_pose" + ref_pose_source.suffix.lower())
        if ref_pose_source
        else None
    )

    if args.audio:
        audio_source = ensure_exists(Path(args.audio), "Audio")
        audio_path = stage_input_file(audio_source, run_dir, "input_audio" + audio_source.suffix.lower())
    else:
        audio_path = run_dir / "input_audio.mp3"
        print(f"[1/3] Synthesizing speech with Edge TTS: {args.voice}")
        run_async(synthesize_text(args.text, args.voice, args.rate, audio_path))

    command = build_inference_command(
        args,
        staged_image_path,
        audio_path,
        run_dir,
        staged_ref_eyeblink,
        staged_ref_pose,
    )
    print(f"[2/3] Generating talking head from {image_path.name}")
    completed = subprocess.run(
        command,
        cwd=SADTALKER_ROOT,
        text=True,
        capture_output=True,
    )

    if completed.returncode != 0:
        if completed.stdout:
            print(completed.stdout, file=sys.stderr)
        if completed.stderr:
            print(completed.stderr, file=sys.stderr)
        raise SystemExit(completed.returncode)

    generated_mp4 = find_generated_mp4(completed.stdout, run_dir)
    final_mp4 = run_dir / "talking-head.mp4"
    if generated_mp4.resolve() != final_mp4.resolve():
        if final_mp4.exists():
            final_mp4.unlink()
        shutil.move(str(generated_mp4), str(final_mp4))

    metadata: dict[str, Any] = {
        "image": str(image_path),
        "audio": str(audio_path.resolve()),
        "video": str(final_mp4.resolve()),
        "voice": args.voice if args.text else None,
        "size": args.size,
        "preprocess": args.preprocess,
        "still": args.still,
        "enhancer": args.enhancer,
        "ref_eyeblink": str(ref_eyeblink_source) if ref_eyeblink_source else None,
        "ref_pose": str(ref_pose_source) if ref_pose_source else None,
    }
    (run_dir / "run.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"[3/3] Done: {final_mp4}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
