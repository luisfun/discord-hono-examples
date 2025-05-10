import { type GuildTableColumns, tableName } from './create-guild-table.js'

export const getGuild = (db: D1Database, guild_id: string | undefined) => {
  if (!guild_id) return null
  return db.prepare(`SELECT * FROM ${tableName} WHERE guild_id = ?`).bind(guild_id).first<GuildTableColumns>()
}
