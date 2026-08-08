# Flujo

> A personal expense tracker with an editorial / ledger aesthetic.
> Local-first, no account, no server, no tracking.

![Status](https://img.shields.io/badge/status-beta_1-brown)
![Demo](https://img.shields.io/badge/demo-live-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Local-first](https://img.shields.io/badge/data-local_first-success)

## Live demo

https://notjuangamer10.github.io/flujo/

## What it is

Flujo is a personal expense tracker built to feel like keeping a
private book of accounts. Instead of the typical finance app look
(blue cards, Material shadows, green/red pie charts), it uses a paper
cream background, ink black text, an ochre accent, and three
typefaces working together — Fraunces (serif) for titles, Inter Tight
for UI, and JetBrains Mono with tabular numerals for amounts so they
align like a real accounting book.

Everything is stored locally in the browser. No account, no server, no
tracking. The data never leaves your device.

## Features (current — Beta 1)

- Add an expense: amount, category, description, date
- Eight categories: food, transport, leisure, home, studies, clothes,
  health, other
- Browse expenses by month with a selector in the header
- Three summary totals: spent this month, count, and average
- Expenses listed with running numbers (001, 002…) like a ledger
- Delete expenses with confirmation
- All data persists in localStorage

## Design choices

- **Editorial ledger aesthetic** — inspired by old accounting books
- **Three typefaces** — Fraunces (serif) for titles, Inter Tight for
  UI text, JetBrains Mono with `font-variant-numeric: tabular-nums`
  for amounts
- **Paper cream + ink + ochre palette** — no blue, no Material
- **No card borders** — only thin dividing lines, like a real ledger
- **Single column, 640px max** — calm, focused, readable

## Tech stack

| Layer    | Technology          |
|----------|---------------------|
| Markup   | HTML5               |
| Styles   | CSS3               |
| Logic    | Vanilla JavaScript  |
| Storage  | localStorage        |
| Fonts    | Fraunces, Inter Tight, JetBrains Mono |

No frameworks, no build step, no dependencies.

## Run locally

Just open `index.html` in any browser. No install, no config.

## Roadmap

- [x] **Beta 1** — basic expense tracking with month selector
- [x] **Beta 2** — Sankey diagram of money flow + bar charts
- [x] **Beta 3** — OCR ticket scanner (offline, Tesseract.js)
- [ ] **Beta 4** — debt ledger + shared expenses + pattern detection
- [ ] **Beta 5** — FastAPI + SQLite backend for sync + PWA installable

## AI usage declaration

This project was built with the assistance of AI. The author is a
student learning to program and used AI (Gemini and an AI coding
assistant) as a learning tool and coding teacher throughout the
project.

AI helped with:
- Explaining JavaScript, HTML and CSS concepts the author didn't
  understand (localStorage, fetch, canvas drawing, hoisting, etc.)
- Writing the initial code structure for each feature
- Debugging issues, especially recurring editor autocomplete bugs
- Suggesting the editorial design direction and selecting the
  combination of typefaces
- Reviewing and refactoring code

The author:
- Made all design decisions (the "ledger editorial" concept, the
  cream + ink + ochre palette, the choice of three typefaces)
- Chose what to build in each beta and why
- Reviewed and tested every line of generated code in the browser
- Asked for explanations until they understood what each part does

The project is the author's in the sense that they directed it, chose
what to build, and understood what was built. AI was a teacher and
assistant, not the sole creator.

## Author

Made by hand as a learning project.
