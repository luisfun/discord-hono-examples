/**
 * Initialize the guild table
 *
 * columns: guild_id, channel_id, cross_guild_id, updated_at
 */
export const createGuildTable = (db: D1Database) =>
  db
    .prepare(
      'CREATE TABLE IF NOT EXISTS guild (guild_id TEXT PRIMARY KEY, channel_id TEXT, cross_guild_id TEXT, updated_at INTEGER)',
    )
    .run()
