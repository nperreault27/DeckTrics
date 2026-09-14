# mtg-commander-tracker

Expo + React Native app for tracking MTG Commander pod games: who played
what deck, turn order, who won, how the game ended, and post-game
commentary — plus stats derived from that log.

Built with expo-router (file-based routing), expo-sqlite (local database),
zustand (state), React Native Paper (UI components), and
react-native-gifted-charts (bar / pie / radar / line charts).

## What's included

- `lib/db.ts` — full schema, migrations, tag seeding, and every stats query
  the app uses (see "Database schema" below)
- `store/useDecksStore.ts` / `store/useGamesStore.ts` — zustand stores
  wrapping the DB layer
- `components/AutocompleteSearch.tsx` — Paper-based autocomplete, extended
  with an optional "+ Add \<query\>" row for creating a new deck inline
- `components/TagChipGroup.tsx` — chip-based tag picker, single-select
  (win condition / elimination reason) or multi-select (comment tags)
- `components/SeatForm.tsx` — one player's inputs within the log-a-game form
- `app/index.tsx` — game log (list of past games) + nav to Decks / Stats
- `app/new-game.tsx` — log a new game: total turns + 4 seats
- `app/decks/index.tsx` — deck list, add new decks
- `app/decks/[id].tsx` — per-deck stats
- `app/stats.tsx` — overview stats across all decks

## Database schema

Fixed 4-player pod (confirmed, not variable), decks tracked for everyone
at the table (not just your own), no opponent identity tracking (matchups
are deck-vs-deck, not player-vs-player), and no separate free-text game
notes — just the tag checkboxes.

```sql
CREATE TABLE decks (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  commander TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE games (
  id INTEGER PRIMARY KEY,
  played_at TEXT NOT NULL DEFAULT (datetime('now')),
  total_turns INTEGER NOT NULL
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('game_end_reason', 'comment'))
);

CREATE TABLE game_players (
  id INTEGER PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  deck_id INTEGER NOT NULL REFERENCES decks(id),
  turn_order INTEGER NOT NULL,
  is_winner INTEGER NOT NULL DEFAULT 0,
  eliminated_turn INTEGER,           -- NULL if won
  win_condition_id INTEGER REFERENCES tags(id),      -- set only if winner
  elimination_reason_id INTEGER REFERENCES tags(id)  -- set only if eliminated
);

CREATE TABLE game_player_comments (
  game_player_id INTEGER NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (game_player_id, tag_id)
);
```

`win_condition_id` and `elimination_reason_id` both pull from the same
`game_end_reason` tag pool (per your call — "how a player left the game"
means the same thing whether they won or were eliminated by it).

### Seeded tags (in `lib/db.ts`, editable there)

**Game end reasons** (used for both win condition and elimination reason):
Combat damage, Commander damage, Combo kill, Mill / decked out, Alternate
win condition, Direct damage / burn, Poison / infect, Concession.

**Comment tags** (multi-select, feeds the radar chart):
Flooded, Screwed (mana), Strong opening hand, Slow start, Combo came
online, Drew removal when needed, Lacked interaction, Overextended into
wipe, Targeted by table, Political misplay, Fun game.

Tags seed on first launch (and are idempotent — re-running never creates
duplicates), so you can edit the arrays in `lib/db.ts` and they'll pick up
new entries on next launch without touching existing data.

### Placement calculation

Placement isn't stored — it's derived so it can never drift out of sync
with the raw data. The winner is always 1st. Everyone else is ranked by
`eliminated_turn DESC` (the last player eliminated took 2nd place, the
first player eliminated took last), computed with a SQL window function
in `getPlacementsByTurnOrder()`.

### Matchups are deck-vs-deck, not player-vs-player

Since opponent identity isn't tracked, "best/worst matchups" on the
per-deck screen means "how this deck performed in games that included
that opponent deck" — not a strict 1v1 record, since Commander is
free-for-all and multiple players share a pod.

## Stats implemented

**Overview** (`app/stats.tsx`): win % by deck (bar), decks used (pie),
placements by turn order, avg/total turns, games played over time (bar),
featured deck (highest win rate, min. 3 games played).

**Per deck** (`app/decks/[id].tsx`): win rate by turn order (bar), avg
turns to win/lose, games played/won over time (2-line chart — see note
below), post-game comment tags (radar), ways this deck wins / loses (from
`win_condition_id` / `elimination_reason_id`), best/worst matchups.

### Note on the 2-line chart

`react-native-gifted-charts`'s `LineChart` takes a second series via the
`data2` prop (with `color1` / `color2` for each line's color) — confirmed
directly against the library's shipped type definitions rather than
assumed, since this isn't obvious from the main docs.

### Note on the radar chart

`RadarChart` takes a flat `data: number[]` (one value per axis) and a
matching `labels: string[]` — also confirmed against the library's type
definitions.

## 1. Install

```bash
npm install
npx expo install --fix
```

## 2. Run it

```bash
npx expo start
```
Scan the QR code with Expo Go (Android/iOS), or press `a` / `i` for an
emulator/simulator if you have Android Studio / Xcode installed.

## 3. Before building for Play Store

Before you build for Play Store, two things to change in `app.json`: the
placeholder `android.package` (`com.yourcompany.myapp`) needs to be your
real unique package id, and you'll need actual icon/splash images in
`assets/` (no placeholders are included in this scaffold).

- `android.package` — reverse-domain style (e.g. `com.yourname.myapp`),
  and it can't be changed after your first publish to Play Store.
- `icon.png`, `splash.png`, `adaptive-icon.png` — drop real image files into
  `assets/` matching the paths already referenced in `app.json`.
- Also update `name` / `slug` in `app.json` if you want a different app
  name or Expo project slug.

## 4. Build an AAB for Google Play

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

## 5. Submit to Google Play

```bash
eas submit --platform android
```
(Requires a Google Play service account key set up once — Play Console →
Setup → API access.)

## Adding more data later

To change the schema, add a new entry to the `migrations` array in
`lib/db.ts` rather than editing the existing entry — this keeps upgrades
non-destructive for anyone who already has games logged.
