#!/usr/bin/env python3
# /// script
# dependencies = [
#   "requests>=2.31",
#   "python-frontmatter>=1.1",
# ]
# ///

"""Generate TTS audio for Hugo blog posts using the Inworld TTS API."""

import argparse
import json
import logging
import os
import re
import subprocess
import tempfile
from pathlib import Path

import frontmatter
import requests

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

API_URL = "https://api.inworld.ai/tts/v1/voice"
VOICE = "Dennis"
MODEL = "inworld-tts-1.5-max"
MAX_CHUNK_CHARS = 2000
CONTENT_DIR = Path("content/blog")
AUDIO_DIR = Path("static/audio")


def clean_text(md: str) -> str:
    """Strip markdown/Hugo artifacts for TTS consumption."""
    # Remove Hugo shortcodes (both {{< >}} and {{< />}} forms, including multiline)
    md = re.sub(r"\{\{<.*?>}}", "", md, flags=re.DOTALL)
    md = re.sub(r"\{\{%.*?%}}", "", md, flags=re.DOTALL)
    # Remove code blocks, keep inline code text (strip backticks only)
    md = re.sub(r"```[\s\S]*?```", "", md)
    md = re.sub(r"`([^`\n]+)`", r"\1", md)
    # Remove images
    md = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", md)
    # Convert links to just text
    md = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", md)
    # Remove HTML tags
    md = re.sub(r"<[^>]+>", "", md)
    # Remove heading markers
    md = re.sub(r"^#{1,6}\s+", "", md, flags=re.MULTILINE)
    # Remove bold/italic markers
    md = re.sub(r"\*{1,3}([^*]+)\*{1,3}", r"\1", md)
    md = re.sub(r"_{1,3}([^_]+)_{1,3}", r"\1", md)
    # Normalize whitespace
    md = re.sub(r"\n{2,}", "\n\n", md)
    return md.strip()


def chunk_text(text: str) -> list[str]:
    """Split text into chunks at sentence boundaries, respecting MAX_CHUNK_CHARS."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current = ""
    for sentence in sentences:
        if not sentence.strip():
            continue
        if current and len(current) + len(sentence) + 1 > MAX_CHUNK_CHARS:
            chunks.append(current.strip())
            current = ""
        current += " " + sentence if current else sentence
    if current.strip():
        chunks.append(current.strip())
    return chunks


def call_tts(text: str, api_key: str) -> bytes:
    """Call Inworld TTS API and return raw audio bytes."""
    resp = requests.post(
        API_URL,
        headers={
            "Authorization": f"Basic {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "voiceId": VOICE,
            "modelId": MODEL,
        },
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    import base64

    return base64.b64decode(data["audioContent"])


def concat_audio(parts: list[Path], output: Path) -> None:
    """Concatenate MP3 parts using ffmpeg."""
    if len(parts) == 1:
        parts[0].rename(output)
        return
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        for p in parts:
            f.write(f"file '{p}'\n")
        listfile = f.name
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", str(output)],
            check=True,
            capture_output=True,
        )
    finally:
        os.unlink(listfile)


def process_post(post_dir: Path, api_key: str, force: bool) -> None:
    """Generate audio for a single blog post."""
    index_file = post_dir / "index.md"
    if not index_file.exists():
        return

    post = frontmatter.load(index_file)

    # Opt-out check
    if post.get("audio") is False:
        log.info(f"Skipping {post_dir.name} (audio: false)")
        return

    slug = post_dir.name
    output = AUDIO_DIR / f"{slug}.mp3"

    if output.exists() and not force:
        log.info(f"Skipping {slug} (already exists)")
        return

    log.info(f"Generating audio for {slug}...")
    text = clean_text(post.content)
    chunks = chunk_text(text)
    log.info(f"  {len(chunks)} chunk(s), {len(text)} chars total")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmpdir:
        parts = []
        for i, chunk in enumerate(chunks):
            log.info(f"  Chunk {i + 1}/{len(chunks)} ({len(chunk)} chars)")
            audio_bytes = call_tts(chunk, api_key)
            part = Path(tmpdir) / f"part_{i:03d}.mp3"
            part.write_bytes(audio_bytes)
            parts.append(part)

        concat_audio(parts, output)

    log.info(f"  Saved {output} ({output.stat().st_size / 1024:.0f} KB)")


def main():
    parser = argparse.ArgumentParser(description="Generate TTS audio for blog posts")
    parser.add_argument("--force", action="store_true", help="Regenerate even if audio exists")
    args = parser.parse_args()

    api_key = os.environ.get("INWORLD_API_KEY")
    if not api_key:
        log.error("INWORLD_API_KEY environment variable not set")
        raise SystemExit(1)

    post_dirs = sorted(CONTENT_DIR.glob("*/"))
    post_dirs = [d for d in post_dirs if (d / "index.md").exists()]

    if not post_dirs:
        log.info("No blog posts found")
        return

    for post_dir in post_dirs:
        process_post(post_dir, api_key, args.force)

    log.info("Done.")


if __name__ == "__main__":
    main()
