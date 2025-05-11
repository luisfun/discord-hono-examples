import { tableName } from './create-guild-table.js'

/**
 * replace guild info
 */
export const setGuild = (
  db: D1Database,
  guild_id: string | undefined,
  guild_name: string | undefined,
  channel_id: string | undefined,
  cross_guild_id: string | undefined,
) => {
  if (!guild_id || !guild_name) throw new Error('Guild ID or Name is undefined')
  return db
    .prepare(
      `REPLACE INTO ${tableName} (guild_id, guild_name, channel_id, cross_guild_id, updated_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(guild_id, guild_name, channel_id, cross_guild_id, Date.now())
    .run()
}
