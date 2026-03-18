---
title: "How to Use Agent Skills for Domain-Specific Learning"
author: Tillmann Bedau
date: 2026-03-17
description: "LLMs are reasoning engines, not knowledge databases. Agent skills let you connect them to authoritative sources and build structured learning workflows — here's how I did it for pathology board prep."
---

Most colleagues I work with use AI daily — almost always through their own private subscriptions to ChatGPT, Claude, or Gemini. And increasingly, they don't just use it to just draft emails or bounce ideas. They use it to answer clinical knowledge questions. "What are the diagnostic criteria for X?" typed into ChatGPT, answer accepted, move on.

The models have gotten remarkably good at this, and I understand the appeal. In certain cases, the models do search the internet for sources — sometimes automatically, sometimes only when explicitly asked. But it's easy to miss whether the model actually retrieved something or just generated a confident-sounding answer from its training data. Usually, the response reads well either way.

Most of the time this is fine. But LLMs still hallucinate. They will still fabricate diagnostic criteria, invent citations, and misrepresent levels of evidence. In a 2023 correspondence in *Nature Medicine*, Truhn, Reis-Filho, and Kather {{< cite "truhnLargeLanguageModels2023" >}} made a point that I think is still underappreciated. The paper was written in the GPT-4 era, and models have evolved enormously since then — they're more accurate, better at tool use, and less prone to confident fabrication. But the core insight still holds: the problem isn't the models themselves — it's that we treat them as knowledge databases when we should be using them as reasoning engines. LLMs are genuinely good at logic, analogy, causal reasoning, and evidence evaluation. What they're not reliable at is being a source of facts. The fix isn't to stop using them — it's to give them the right facts and let them do what they're actually good at.

This reframing — reasoning engine, not knowledge database — is exactly what *agent skills* are designed to enable.

## What agent skills actually are

An agent skill is a set of markdown files that give an AI agent structured instructions for a specific task — what tools to use, what steps to follow, what the output should look like. They're not plugins or compiled code. They're prompts with architecture.

The key difference from a regular prompt: skills can reference tools. A skill can tell the agent to run a CLI command, search a database, fetch content from an API, and then reason over the results. The agent isn't generating from memory — it's working with live data through a workflow you designed.

This matters for learning because the two hardest problems with using AI for researching or studying are grounding (is the information accurate?) and structure (is the learning experience well-designed?). Skills let you solve both by encoding your domain expertise into reusable workflows.

## A worked example: pathology board prep

I'll use [a skill I built for studying the WHO Classification of Tumours](https://github.com/tbedau/who-blue-books-skills) — the definitive reference in diagnostic pathology — as a concrete example. But the pattern applies to any domain where you have authoritative sources and want to turn an AI agent into a structured learning tool.

The WHO Blue Books are 18 comprehensive volumes covering every tumor classification in the body. They're essential for board prep and daily practice, but they're structured as a reference, not a curriculum. Reading them linearly is like trying to learn a language by reading the dictionary.

The skill I built gives Claude three workflows:

**Lookup** — Ask a specific question, get a WHO-grounded answer. "What are the diagnostic criteria for follicular lymphoma?" The agent searches the actual Blue Books through a CLI, reads the relevant chapters, and answers with citations. No hallucinated criteria, no training-data-vintage information.

**Study Plan** — Give it a Blue Book and it generates 10–25 thematic learning clusters. It's explicitly tasked to not just blindly follow the table of contents, but to group entities that benefit from being studied together — things that share a differential, have overlapping morphology, or illuminate each other through contrast.

**Deep Dive** — Comprehensive 2,000–4,000 word teaching reviews that synthesize raw WHO content into high-yield study material. The agent reads every relevant chapter, reasons about the classification structure, and teaches the topic back with comparative tables and diagnostic reasoning embedded throughout.

## The anatomy of a skill

The entire skill is four markdown files:

```
who-blue-books/
  SKILL.md              # Entry point — routing logic, CLI reference
  references/
    lookup.md           # Lookup workflow instructions
    study-plan.md       # Study plan workflow instructions
    deep-dive.md        # Deep dive workflow instructions
```

`SKILL.md` is loaded when the skill activates. It figures out which workflow the user wants and loads only that reference file. The workflow files contain step-by-step instructions: what to search for, how to prioritize content, what format to output, what to emphasize.

The skill itself is just markdown — structured instructions that tell an agent how to use a tool effectively. The tool it relies on is a CLI that connects to the WHO Classification database (a valid subscription is required, of course).

This points to a broader shift. I believe GUIs are becoming less central. What matters increasingly is whether a service exposes its data in a way that agents can consume well — through APIs, CLIs, structured feeds. The WHO Classification has a website, but the skill doesn't use the website. It uses a CLI that talks to the same data, in a format the agent can actually work with. APIs and CLIs are having their moment.

## Output goes wherever you need it

The simplest setup is to just read the agent's answers inline — in Claude Code, Codex, Gemini CLI, whatever harness you prefer. But with a little extra customization, you can route output anywhere.

I send most of my deep dives and study plans to Obsidian. Agents produce markdown natively, and Obsidian is — in my opinion — the best tool for working with markdown files locally. The output lands as a note I can link, annotate, and revisit. You could just as easily pipe it to a text-to-speech tool and listen to a teaching review on your commute.

One thing I deliberately don't automate: flashcard generation. You could have the agent turn deep dives into Anki decks directly, but I still value the process of creating flashcards by hand. The act of deciding what's worth a card and how to phrase it is part of the learning. Automating that away would save time but cost understanding.

## Everything is just text

Don't like the output format? Change the skill definition. Want the deep dive to emphasize molecular features over morphology? Edit a line in `deep-dive.md`. Want shorter teaching reviews? Adjust the word count guidance. Want to add an entirely new workflow — say, one that generates case-based practice questions? Write a new markdown file and add a routing entry in `SKILL.md`.

This is the advantage of skills being plain text rather than compiled code. The barrier to customization is as low as it gets and they will get better over time as you encode more of your own experience and taste into the skill definition.

## Why grounding matters more than model quality

This approach respects something important: the authoritative sources stay authoritative. We're not betting on models getting good enough to answer factual questions from training data alone. Instead, following the abovementioned paper's central claim — "a more effective way to utilize LLMs in medical research would be to focus on their reasoning skills, which can be achieved by integrating them with external knowledge sources" {{< cite "truhnLargeLanguageModels2023" >}} — we rely on models only for what they're demonstrably good at: reasoning, synthesis, comparison, and structured explanation.

Better models will improve the experience. A larger context window means the agent can read more chapters at once. Better tool use means more reliable CLI interactions. Stronger instruction-following means the output adheres more closely to your skill's format. But these are quality-of-life improvements. The factual accuracy comes from the source, not the model. That's the whole point.

## Building your own

The pattern generalizes beyond pathology. The core ingredients are:

1. **An authoritative source** accessible through some tool — a CLI, an API, a local database, even a well-organized folder of PDFs
2. **Domain knowledge about what good learning looks like** — what to prioritize, how to structure comparisons, what misconceptions to address
3. **Repeatable workflows** — things you do often enough that encoding them pays off

For pathology, the authoritative source is the WHO Classification. For a lawyer, it might be some legal database. For an engineer, it might be a reference manual parser. The domain changes; the architecture doesn't.

Start with one workflow. The lookup pattern (search, read, synthesize with citations) is the simplest and most immediately useful. Once that works well, add structure: study plans that organize the material, deep dives that teach it back. Each new workflow is just another markdown file with instructions.

The WHO Blue Books skill is available [on GitHub](https://github.com/tbedau/who-blue-books-skills). But the real point isn't the skill itself — it's the pattern. If you have authoritative sources in your field but you're asking LLMs factual questions without grounding them in those sources, you're leaving capability on the table. Give them the facts and let them reason about those facts.

{{< bibliography >}}
