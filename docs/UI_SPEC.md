# DeckTrics — "Notebook" visual spec

A Magic: the Gathering game log that looks like a guy keeping score by hand in a ruled notebook. Everything is ballpoint pen on paper. No cards, no shadows, no fills, no rounded-rect UI chrome.

## Type

- **Caveat** — all headings, screen titles, numbers, buttons, nav, list item titles. 600–700 for emphasis, 500 for secondary.
- **Kalam** — body copy and metadata (weight 300), and small uppercase labels (weight 700, 11–12px, letter-spacing .12–.16em).
- Numbers are large and Caveat, never a monospace or sans. Hero stat 82px/.86.

## Color

| Role | Value |
|---|---|
| Desk/canvas behind the phone | `#e8e2d4` |
| Paper | `#fdfaf0` |
| Ruled line (every 32px) | `#cfd9e8` — `repeating-linear-gradient(to bottom,transparent 0,transparent 31px,#cfd9e8 31px,#cfd9e8 32px)` |
| Ink (primary text) | `#22304a` |
| Pen blue (accent, wins, active state, links) | `#26418f` |
| Pen red (losses, annotations) | `#b2493d` |
| Pencil tan (labels, muted) | `#7a6a52` |
| Body grey | `#4a4132` |
| Faint | `#8a8478` |
| Margin rule / header rule (2px) | `#d9b4ad` |

## Rules, not boxes

Structure comes from horizontal rules (1.5–2px, `#cfd9e8` or `#22304a`), not from cards or backgrounds. Section headings are underlined with a 2px border-bottom rather than sitting in a header bar. Never use a filled button or a box-shadow.

## Hand-drawn imperfection

Any element that needs a border gets an irregular radius so it reads as drawn by hand, e.g. `border-radius: 18px 12px 20px 11px` — each corner different. Buttons are a 2.5px pen outline in `#26418f` with an irregular radius and the label in Caveat 26px. Chips/filter pills the same at smaller scale.

## Charts and marks are drawn, not rendered

- Bar charts are stroked SVG paths, 2.2px, round caps, no fill.
- Trend arrows are hand-curved SVG paths.
- Seat/count tracking uses tally marks (four strokes and a diagonal) rather than numerals.

## Navigation — running head

- No bottom tab bar.
- Masthead: "DeckTrics" in Caveat 700/34px pen blue, with "notebook no. 3" in Kalam 300/13px tan right-aligned.
- Directly under it, a row of section names in Caveat 25px: active one is `#26418f` weight 700 with a 2.5px pen underline; inactive ones `#8a8478` weight 500.
- A 2px `#d9b4ad` rule closes the whole header.
- Content scrolls to the bottom edge of the screen.

## Layout

- Screen padding: 26px left (inside the margin rule), 20px right.
- **List row:** left column is the placement — "1st"/"3rd" — in Caveat 700/30px, blue for a win, red otherwise, fixed 44px width. Right side is the deck name (Caveat 600/24px) with two Kalam 300 metadata lines under it (14px how it ended, 13px opponents and date).
- **Stat rows:** label-above-number pairs in a flex row, bounded top and bottom by 2px `#cfd9e8` rules.
- Occasional marginal annotation in Kalam 300 italic `#b2493d` — e.g. "note: stop casting Krenko into open mana".

## Screens

- Home (win rate hero, stat row, "write down a game" button, games played list)
- Stats
- Decks list
- Deck detail
- Three-step "Log a game" flow

## Avoid

Drop shadows, gradients, filled color blocks, sans-serif type, emoji, material/iOS component conventions.
