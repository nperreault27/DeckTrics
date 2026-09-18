import * as SQLite from 'expo-sqlite';

// --- Types --------------------------------------------------------------

export type Deck = {
  id: number;
  name: string;
  commander: string | null;
  isUsers: boolean;
};

export type Tag = {
  id: number;
  label: string;
  category: 'game_end_reason' | 'comment';
};

export type SeatInput = {
  deckId: number;
  turnOrder: number;
  placement: number;
  eliminatedTurn: number | null;
  winConditionId: number | null;
  eliminationReasonId: number | null;
  commentTagIds: number[];
};

export type NewGameInput = {
  totalTurns: number;
  seats: SeatInput[]; 
};

export type GameListItem = {
  id: number;
  played_at: string;
  total_turns: number;
  deck_name: string;
  placement: number;
};

export const POD_SIZE = 4;

const GAME_END_REASONS = [
  'Combat damage',
  'Commander damage',
  'Combo kill',
  'Mill / decked out',
  'Alternate win condition',
  'Direct damage / burn',
  'Poison / infect',
  'Concession',
];

const COMMENT_TAGS = [
  'Flooded',
  'Screwed (mana)',
  'Strong opening hand',
  'Slow start',
  'Combo came online',
  'No card draw',
  'No finishers seen',
  'Lacked interaction',
  'Overextended into wipe',
  'Targeted by table',
  'Politicked poorly',
  'Fun game',
];

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitialization: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
      return Promise.resolve(dbInstance);
  }

  if (!dbInitialization) {
      dbInitialization = (async () => {
          const db = await SQLite.openDatabaseAsync('mtg-tracker.db');
          await runMigrations(db);
          dbInstance = db;
          return db;
      })().catch((error) => {
          dbInitialization = null;
          throw error;
      });
  }

  return dbInitialization;
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM schema_meta WHERE key = 'version'`
  );
  const currentVersion = row ? parseInt(row.value, 10) : 0;

  const migrations: Array<(db: SQLite.SQLiteDatabase) => Promise<void>> = [
    // v1: core schema
    async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS decks (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL UNIQUE,
          commander TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          is_users INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS games (
          id INTEGER PRIMARY KEY NOT NULL,
          played_at TEXT NOT NULL DEFAULT (datetime('now')),
          total_turns INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY NOT NULL,
          label TEXT NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('game_end_reason', 'comment'))
        );

        CREATE TABLE IF NOT EXISTS game_players (
          id INTEGER PRIMARY KEY NOT NULL,
          game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
          deck_id INTEGER NOT NULL REFERENCES decks(id),
          turn_order INTEGER NOT NULL,
          placement INTEGER NOT NULL,
          eliminated_turn INTEGER,
          win_condition_id INTEGER REFERENCES tags(id),
          elimination_reason_id INTEGER REFERENCES tags(id)
        );

        CREATE TABLE IF NOT EXISTS game_player_comments (
          game_player_id INTEGER NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
          tag_id INTEGER NOT NULL REFERENCES tags(id),
          PRIMARY KEY (game_player_id, tag_id)
        );
      `);
    },
    // v2, v3, ... add future schema changes here as new entries -
    // never edit the migration above once it has shipped.
  ];

  for (let v = currentVersion; v < migrations.length; v++) {
    await migrations[v](db);
    await db.runAsync(
      `INSERT INTO schema_meta (key, value) VALUES ('version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [String(v + 1)]
    );
  }

  await seedTags(db);
}

// Idempotent: only inserts tags that don't already exist by label, so
// re-running on an existing install never creates duplicates.
async function seedTags(db: SQLite.SQLiteDatabase) {
  const existing = await db.getAllAsync<{ label: string }>('SELECT label FROM tags');
  const existingLabels = new Set(existing.map((t) => t.label));

  for (const label of GAME_END_REASONS) {
    if (!existingLabels.has(label)) {
      await db.runAsync('INSERT INTO tags (label, category) VALUES (?, ?)', [label, 'game_end_reason']);
    }
  }
  for (const label of COMMENT_TAGS) {
    if (!existingLabels.has(label)) {
      await db.runAsync('INSERT INTO tags (label, category) VALUES (?, ?)', [label, 'comment']);
    }
  }
}

// --- Decks ---------------------------------------------------------------

export async function listDecks(): Promise<Deck[]> {
  const db = await getDb();
  return db.getAllAsync<{
    id: number;
    name: string;
    commander: string | null;
    is_users: number;
  }>('SELECT * FROM decks ORDER BY name ASC').then((rows) =>
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      commander: row.commander,
      isUsers: row.is_users === 1,
    }))
  );
}

export async function createDeck(name: string, isUsers: boolean, commander?: string, ): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO decks (name, commander, is_users) VALUES (?, ?, ?)',
    [name, commander ?? null, isUsers ? 1 : 0]
  );
  return result.lastInsertRowId;
}

// --- Tags ------------------------------------------------------------------

export async function listTagsByCategory(category: Tag['category']): Promise<Tag[]> {
  const db = await getDb();
  return db.getAllAsync<Tag>('SELECT * FROM tags WHERE category = ? ORDER BY id ASC', [category]);
}

// --- Games -----------------------------------------------------------------

// Inserts a game and all 4 seats (plus their comment tags) as a single
// transaction, so a partially-written game can never be left behind.
export async function createGame(input: NewGameInput): Promise<number> {
  if (input.seats.length !== POD_SIZE) {
    throw new Error(`Expected ${POD_SIZE} seats, got ${input.seats.length}`);
  }

  const db = await getDb();
  let gameId = 0;

  await db.withTransactionAsync(async () => {
    const gameResult = await db.runAsync(
      'INSERT INTO games (total_turns) VALUES (?)',
      [input.totalTurns]
    );
    gameId = gameResult.lastInsertRowId;

    for (const seat of input.seats) {
      const seatResult = await db.runAsync(
        `INSERT INTO game_players
          (game_id, deck_id, turn_order, placement, eliminated_turn, win_condition_id, elimination_reason_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          seat.deckId,
          seat.turnOrder,
          seat.placement,
          seat.eliminatedTurn,
          seat.winConditionId,
          seat.eliminationReasonId,
        ]
      );
      const gamePlayerId = seatResult.lastInsertRowId;

      for (const tagId of seat.commentTagIds) {
        await db.runAsync(
          'INSERT INTO game_player_comments (game_player_id, tag_id) VALUES (?, ?)',
          [gamePlayerId, tagId]
        );
      }
    }
  });

  return gameId;
}

export async function listGames(): Promise<GameListItem[]> {
  const db = await getDb();
  return db.getAllAsync<GameListItem>(`
    SELECT g.id, g.played_at, g.total_turns, d.name AS deck_name, gp.placement as placement
    FROM games g
    JOIN game_players gp ON gp.game_id = g.id
    JOIN decks d ON d.id = gp.deck_id
    WHERE d.is_users = 1
    ORDER BY g.played_at DESC
  `);
}

// --- Overview stats ----------------------------------------------------

export type DeckWinStats = { deck_id: number; name: string; games: number; wins: number };

export async function getWinStatsByDeck(): Promise<DeckWinStats[]> {
  const db = await getDb();
  return db.getAllAsync<DeckWinStats>(`
    SELECT d.id AS deck_id, d.name, COUNT(*) AS games, SUM(CASE WHEN gp.placement = 1 THEN 1 ELSE 0 END) AS wins
    FROM game_players gp
    JOIN decks d ON d.id = gp.deck_id
    WHERE d.is_users = 1
    GROUP BY d.id
    ORDER BY wins DESC
  `);
}

export type TurnOrderWinRate = {
  turn_order: number;
  games: number;
  wins: number;
  win_pct: number;
};

export async function getTurnOrderWinRate(): Promise<TurnOrderWinRate[]> {
  const db = await getDb();

  return db.getAllAsync<TurnOrderWinRate>(
    `
      SELECT
        gp.turn_order,
        COUNT(*) AS games,
        SUM(CASE WHEN gp.placement = 1 THEN 1 ELSE 0 END) AS wins,
        CAST(
          SUM(CASE WHEN gp.placement = 1 THEN 1 ELSE 0 END) AS FLOAT
        ) / COUNT(*) * 100 AS win_pct
      FROM game_players gp
      JOIN decks d ON d.id = gp.deck_id
      WHERE d.is_users = 1
      GROUP BY gp.turn_order
      ORDER BY gp.turn_order ASC
    `
  );
}

export async function getOverviewWinReasons(): Promise<TagCount[]> {
  const db = await getDb();

  return db.getAllAsync<TagCount>(
    `
      SELECT t.id AS tag_id, t.label, COUNT(*) AS count
      FROM game_players gp
      JOIN tags t ON t.id = gp.win_condition_id
      JOIN decks d ON d.id = gp.deck_id
      WHERE d.is_users = 1 AND gp.placement = 1
      GROUP BY t.id
      ORDER BY count DESC
    `
  );
}

export async function getOverviewLoseReasons(): Promise<TagCount[]> {
  const db = await getDb();

  return db.getAllAsync<TagCount>(
    `
      SELECT t.id AS tag_id, t.label, COUNT(*) AS count
      FROM game_players gp
      JOIN tags t ON t.id = gp.elimination_reason_id
      JOIN decks d ON d.id = gp.deck_id
      WHERE d.is_users = 1 AND gp.eliminated_turn IS NOT NULL
      GROUP BY t.id
      ORDER BY count DESC
    `
  );
}

export type DeckUsageRow = { deck_id: number; name: string; count: number };

export async function getDecksUsedCounts(): Promise<DeckUsageRow[]> {
  const db = await getDb();
  return db.getAllAsync<DeckUsageRow>(`
    SELECT d.id AS deck_id, d.name, COUNT(*) AS count
    FROM game_players gp
    JOIN decks d ON d.id = gp.deck_id
    WHERE d.is_users = 1
    GROUP BY d.id
    ORDER BY count DESC
  `);
}

export type OverviewTotals = { avg_turns: number | null; total_turns: number | null; games_played: number };

export async function getOverviewTotals(): Promise<OverviewTotals> {
  const db = await getDb();
  const row = await db.getFirstAsync<OverviewTotals>(`
    SELECT AVG(total_turns) AS avg_turns, SUM(total_turns) AS total_turns, COUNT(*) AS games_played
    FROM games
  `);
  return row ?? { avg_turns: null, total_turns: null, games_played: 0 };
}

// --- Per-deck stats ----------------------------------------------------

export async function getDeckWinRateByTurnOrder(deckId: number): Promise<TurnOrderWinRate[]> {
  const db = await getDb();
  return db.getAllAsync<TurnOrderWinRate>(
    `SELECT turn_order, COUNT(*) AS games, SUM(CASE WHEN gp.placement = 1 THEN 1 ELSE 0 END) AS wins
     FROM game_players gp
     WHERE deck_id = ?
     GROUP BY turn_order
     ORDER BY turn_order ASC`,
    [deckId]
  );
}

export type TagCount = { tag_id: number; label: string; count: number };

export async function getDeckCommentTagCounts(deckId: number): Promise<TagCount[]> {
  const db = await getDb();
  return db.getAllAsync<TagCount>(
    `SELECT t.id AS tag_id, t.label, COUNT(*) AS count
     FROM game_player_comments gpc
     JOIN game_players gp ON gp.id = gpc.game_player_id
     JOIN tags t ON t.id = gpc.tag_id
     WHERE gp.deck_id = ? AND t.category = 'comment'
     GROUP BY t.id
     ORDER BY t.id ASC`,
    [deckId]
  );
}

export type AvgTurnsWinLose = { avg_turns_to_win: number | null; avg_turns_to_lose: number | null };

export async function getDeckAvgTurnsWinLose(deckId: number): Promise<AvgTurnsWinLose> {
  const db = await getDb();
  const win = await db.getFirstAsync<{ avg_turns_to_win: number | null }>(
    `SELECT AVG(g.total_turns) AS avg_turns_to_win
     FROM game_players gp
     JOIN games g ON g.id = gp.game_id
     WHERE gp.deck_id = ? AND gp.placement = 1`,
    [deckId]
  );
  const lose = await db.getFirstAsync<{ avg_turns_to_lose: number | null }>(
    `SELECT AVG(eliminated_turn) AS avg_turns_to_lose
     FROM game_players
     WHERE deck_id = ? AND eliminated_turn IS NOT NULL`,
    [deckId]
  );
  return {
    avg_turns_to_win: win?.avg_turns_to_win ?? null,
    avg_turns_to_lose: lose?.avg_turns_to_lose ?? null,
  };
}

export type MonthlyPlayedWon = { month: string; played: number; won: number };

export async function getDeckGamesPlayedWonByMonth(deckId: number): Promise<MonthlyPlayedWon[]> {
  const db = await getDb();
  return db.getAllAsync<MonthlyPlayedWon>(
    `SELECT strftime('%Y-%m', g.played_at) AS month, COUNT(*) AS played, SUM(CASE WHEN gp.placement = 1 THEN 1 ELSE 0 END) AS won
     FROM game_players gp
     JOIN games g ON g.id = gp.game_id
     WHERE gp.deck_id = ?
     GROUP BY month
     ORDER BY month ASC`,
    [deckId]
  );
}

export type Matchup = { opponent_deck_id: number; opponent_deck_name: string; games: number; wins: number };

// Note: this counts games where the two decks shared a pod, not 1v1
// results - Commander is free-for-all, so "matchup" here means "how this
// deck performed in games that included that opponent," not a head-to-head.
export async function getDeckMatchups(deckId: number): Promise<Matchup[]> {
  const db = await getDb();
  return db.getAllAsync<Matchup>(
    `SELECT od.id AS opponent_deck_id, od.name AS opponent_deck_name,
            COUNT(*) AS games, SUM(CASE WHEN gp.placement = 1 THEN 1 ELSE 0 END) AS wins
     FROM game_players gp
     JOIN game_players ogp ON ogp.game_id = gp.game_id AND ogp.deck_id != gp.deck_id
     JOIN decks od ON od.id = ogp.deck_id
     WHERE gp.deck_id = ?
     GROUP BY od.id
     ORDER BY (CAST(SUM(CASE WHEN gp.placement = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)) DESC`,
    [deckId]
  );
}

export async function getDeckWinReasons(deckId: number): Promise<TagCount[]> {
  const db = await getDb();
  return db.getAllAsync<TagCount>(
    `SELECT t.id AS tag_id, t.label, COUNT(*) AS count
     FROM game_players gp
     JOIN tags t ON t.id = gp.win_condition_id
     WHERE gp.deck_id = ? AND gp.placement = 1
     GROUP BY t.id
     ORDER BY count DESC`,
    [deckId]
  );
}

export async function getDeckLoseReasons(deckId: number): Promise<TagCount[]> {
  const db = await getDb();
  return db.getAllAsync<TagCount>(
    `SELECT t.id AS tag_id, t.label, COUNT(*) AS count
     FROM game_players gp
     JOIN tags t ON t.id = gp.elimination_reason_id
     WHERE gp.deck_id = ? AND gp.eliminated_turn IS NOT NULL
     GROUP BY t.id
     ORDER BY count DESC`,
    [deckId]
  );
}
