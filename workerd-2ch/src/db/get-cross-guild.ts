import { type GuildTableColumns, tableName } from './create-guild-table'

export const getCrossGuild = (db: D1Database, cross_guild_id: string) =>
  db
    .prepare(`SELECT * FROM ${tableName} WHERE cross_guild_id = ?`)
    .bind(cross_guild_id)
    .run<GuildTableColumns>()
    .then(r => r.results)
