import type { CrossLogTableColumns } from './create-cross-log-table.js'

export const getCrossLog = (db: D1Database, cross_guild_id: string | undefined, offset = 0, limit = 20) => {
  if (!cross_guild_id) return []
  return db
    .prepare(`SELECT * FROM _${cross_guild_id} LIMIT ?, ?`)
    .bind(offset, limit)
    .run<CrossLogTableColumns>()
    .then(r => r.results)
}
