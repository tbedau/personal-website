# Scripts

## generate-audio.py

Generates TTS audio for blog posts using the [Inworld TTS API](https://studio.inworld.ai). Runs automatically in CI before Hugo builds; only new/changed posts trigger API calls thanks to caching.

### Local usage

```sh
INWORLD_API_KEY=your-key uv run scripts/generate-audio.py
```

Use `--force` to regenerate existing audio. Requires `ffmpeg` installed.

### Opting out

Add `audio: false` to a post's frontmatter to skip audio generation.
