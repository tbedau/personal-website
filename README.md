# tillmannbedau.com

Personal website built with [Hugo](https://gohugo.io/). Deployed via GitHub Actions.

## Local development

```bash
hugo server -D
```

## Server

`deploy/` holds the nginx container config that runs at
`/srv/docker/applications/personal-website` on the VPS, behind the Traefik
stack from `docker-infrastructure-hetzner-vps`. CI only syncs `public/`, so
changes to `deploy/` must be copied to the server by hand:

```bash
scp deploy/docker-compose.yml deploy/nginx.conf tbedau-vps:/srv/docker/applications/personal-website/
ssh tbedau-vps 'cd /srv/docker/applications/personal-website && docker compose up -d'
```
