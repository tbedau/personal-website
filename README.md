# tillmannbedau.com

Personal website built with [Hugo](https://gohugo.io/), served as static
assets on Cloudflare Workers (personal Cloudflare account).

## Local development

```bash
hugo server -D
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: it generates any
missing post audio, builds with `hugo --minify`, and runs `wrangler deploy`,
which uploads `public/` as configured in `wrangler.jsonc`.

- Repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `INWORLD_API_KEY`.
- Response headers (security, cache) live in `static/_headers`.
- `www.tillmannbedau.com` redirects to the apex via a Cloudflare redirect rule
  on the zone, not in this repo.
- Audio generation is allowed to fail. Commit generated MP3s in
  `static/audio/` so they survive CI cache eviction.

Manual deploy from a clean checkout:

```bash
hugo --minify && npx wrangler deploy
```
