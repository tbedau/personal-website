---
title: "Boring, Local, Weirdly Powerful: My Alternative to OpenClaw"
author: Tillmann Bedau
date: 2026-03-01
description: "OpenClaw promises a 24/7 personal AI agent. I needed something simpler: scheduled headless Claude Code jobs on my MacBook. So I built claude-runner in one night."
---

I genuinely liked the energy around the recent OpenClaw hype. People are actively experimenting with running Mac Minis 24/7, configuring `SOUL.md` personality files so their agent has opinions and preferences, and wiring it into Telegram so it can text them back.

I tried really hard to think of a use case for my personal life, but couldn't really come up with anything. I carry my MacBook everywhere and if I don't, I usually don't need more than what the native Claude iOS app has to offer. I don't need an AI that lives in my group chats. And the security surface of giving a single codebase access to my emails, files, and calendars is not something I'm comfortable with. 

However, I found the new ideas baked into OpenClaw truly special. The "memory" — a bunch of markdown files that give the agent persistent concepts about who you are, your goals, your values, surviving across sessions and reboots. The "heartbeat" — a lightweight periodic check that lets the agent act proactively instead of waiting for input. The built-in cron scheduler that survives reboots. The idea that an AI agent shouldn't just answer questions but do work on your behalf, on a schedule, without you being there.

That last part stuck with me. Not the 24/7 availability, not the messenger integrations — just the scheduled, headless execution of tasks too complex for a deterministic script. Things that require reasoning, tool use, and multi-step workflows, but don't require me to be awake.

## The tweet that started it

In mid-February, Anthropic caused some confusion by updating their docs to say that using Claude subscription tokens in third-party tools was against their Terms of Service. People panicked—especially the OpenClaw community, since most users ran it on their personal Claude subscription.

Then Thariq Shihipar from Anthropic posted a clarification:

{{< x user="trq212" id="2024212380142752025" >}}

`claude -p` is the headless mode of Claude Code. You give it a prompt, it runs non-interactively, and it exits. No UI, no chat window—just input in, output out. It has full access to the same tools as interactive Claude Code: file system, bash, MCP servers, everything. Explicitly encouraged for local automation.

Up until that point I wasn't aware of this headless mode and it immediately got me thinking. I realized what I needed wasn't a 24/7 agent framework that burns through my API tokens. I just needed `claude -p` on a schedule on my existing Max subscription.

## One evening, one script

The core idea is embarrassingly simple: macOS already has a robust job scheduler called launchd. Claude Code already has a headless mode. The only missing piece is the glue between them—something that takes a job definition, runs `claude -p` with the right prompt and environment, handles retries and logging, and reports the result.

That glue is a bash script called `runner.sh`. The actual invocation looks like this:

```bash
claude -p "$PROMPT" --dangerously-skip-permissions --output-format stream-json --verbose
```

Around it: a lockfile mechanism (atomic `mkdir`, not file-based—more reliable), configurable retries with backoff, timeout support, structured logging, and push notifications via ntfy.sh. The script is about 300 lines. The rest is a setup script that converts cron expressions to launchd plists, because macOS doesn't use cron natively and the launchd XML format is not something you want to write by hand.

Jobs are defined in YAML:

```yaml
name: paper-digest
prompt: |
  Query the Zotero API for the oldest paper in the inbox collection.
  Read the full PDF. Write a structured summary as an Obsidian note.
  Convert the note to audio using the TTS script.
  Upload the audio file to R2 and remove the paper from the inbox.
schedule: "20 2 * * *"
retries: 1
timeout: 600
workdir: ~/repos/claude-runner/workspaces/paper-digest
env:
  ZOTERO_API_KEY: zotero_api_key
  R2_ACCESS_KEY: r2_access_key
```

The `env` field maps environment variable names to keys in a gitignored config file. Secrets stay out of job definitions. The `workdir` field lets each job run in its own directory with its own `.mcp.json` and `CLAUDE.md`—so per-job tool configuration and instructions come for free.

Scheduling works through `setup.sh`, which reads all job YAMLs, converts their cron expressions to launchd `StartCalendarInterval` entries, and installs them as launch agents. It also sets a `pmset` wake schedule so the Mac wakes up at 2 AM to run the jobs. If the Mac was asleep when a job was scheduled, launchd catches up automatically when it wakes.

Claude Code built the whole thing in one session for me. Most of the effort went into the cron-to-launchd conversion, which has to expand step values, ranges, and comma-separated lists into the Cartesian product of `<dict>` entries that launchd expects. The rest was straightforward.

## What it actually does for me

My MacBook sits at home, usually hooked up to power overnight. It wakes up at 2 AM anyway for automatic borgmatic backups—so I just piggyback on that wakeup event to run Claude tasks right after.

I have a few use cases that aren't time-critical. I don't need them done right now—I just want them done at some point, and I only care about the result. These are things I never have the time to do during the day, and it's genuinely satisfying to wake up and see that they were handled automatically.

Right now I run three jobs:

- **overnight-tasks** is my general-purpose job. It runs every night and processes a to-do list that I can fill on the go—from my phone, my laptop, wherever. I drop tasks into an Obsidian folder, each with its own instructions and context, and they just get done overnight.
- **literature-alert** runs twice a week. It checks for new publications matching my research interests and writes structured alerts into my Obsidian vault.
- **paper-digest** runs whenever there are papers sitting in my Zotero inbox. It reads the full PDF, writes a structured summary into Obsidian, converts it to audio using a TTS API, and uploads the file to a Cloudflare R2 bucket that serves as a private podcast feed. By the time I'm on the train in the morning, I have a 12-minute episode waiting.

This is just a snapshot. I've tried other jobs, dropped some, and settled on these three for now. The whole setup is really dynamic—I'm still figuring out what works and what doesn't. But the system itself is solid, and having this kind of flexible infrastructure in place makes it easy to experiment.

## The dashboard

After the first few nights, I wanted a better interface than checking log files. So I added a local web server: Hono on the backend, React on the frontend, served on port 7429.

It shows job status, recent runs, live-streaming logs via SSE, and lets me trigger jobs manually or run ad-hoc prompts. More importantly, the server exposes webhooks—so I can trigger any job programmatically, chain jobs together, or kick things off from an iOS Shortcut with a single tap.

{{< image src="dashboard-jobs.webp" alt="Dashboard showing all configured jobs" caption="The jobs overview with schedules and last run status." width="3248" height="2122" >}}

{{< image src="dashboard-editor.webp" alt="Job editor for paper-digest" caption="The job editor showing configuration form and raw YAML side by side." width="3248" height="2122" >}}

This dashboard on my MacBook is my main interface for the whole system. It's where I monitor runs, check results, and re-trigger jobs when something went wrong. It's just a convenient layer on top of all the underlying bash and launchd logic. Since my MacBook is on my Tailscale network, I can also access it from my phone when I'm away—which is a nice bonus, but not the primary use case.

## The boring stack

The whole project is a bash script, a few YAML files, and macOS launchd. The web dashboard is the fanciest part, and it's optional. There's no Docker, no Kubernetes, no cloud deployment, no OAuth token extraction. It runs on the laptop I already own, using the Claude subscription I already pay for, within the Terms of Service.

The constraint of `claude -p` is actually its strength. Each job gets a single prompt. That prompt has to be specific enough that Claude can execute it end-to-end without clarification. This forces you to think clearly about what you actually want—which is exactly the kind of discipline that makes automation reliable.

These are super exciting times. The possibilities this opens up are literally endless—building out any idea is no longer the bottleneck. The real bottleneck is figuring out what's actually useful, and then taking the time to consume the output and learn from it. That's the hard part, and the part I want to spend more of my energy on.

I've published the project [on GitHub](https://github.com/tbedau/claude-runner) in case it's useful to anyone with a similar setup. It's MIT-licensed and works with any Claude Code subscription.
