export type GuildTableColumns = {
  guild_id: string
  channel_id?: string
  cross_guild_id?: string
  updated_at: number
}

export const tableName = 'guild'

/**
 * Initialize the guild table
 *
 * columns: guild_id, channel_id, cross_guild_id, updated_at
 */
export const createGuildTable = (db: D1Database) =>
  db
    .prepare(
      `CREATE TABLE IF NOT EXISTS ${tableName} (guild_id TEXT PRIMARY KEY, channel_id TEXT, cross_guild_id TEXT, updated_at INTEGER NOT NULL)`,
    )
    .run()
