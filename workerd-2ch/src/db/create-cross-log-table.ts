export type CrossLogTableColumns = {
  id: number
  guild_id: string
  user_id: string
  message?: string
  created_at: number
}

/**
 * table name: _{cross_guild_id}
 *
 * columns: id, guild_id, user_id, message, created_at
 */
export const createCrossLogTable = (db: D1Database, cross_guild_id: string | undefined) => {
  if (!cross_guild_id) throw new Error('cross_guild_id is undefined')
  return db
    .prepare(
      `CREATE TABLE IF NOT EXISTS _${cross_guild_id} (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, user_id TEXT NOT NULL, message TEXT, created_at INTEGER NOT NULL)`,
    )
    .run()
}
