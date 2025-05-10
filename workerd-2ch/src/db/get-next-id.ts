import type { CrossLogTableColumns } from './create-cross-log-table'

export const getNextId = (db: D1Database, cross_guild_id: string | undefined) => {
  if (!cross_guild_id) return null
  return db
    .prepare(`SELECT id FROM _${cross_guild_id} ORDER BY id DESC LIMIT 1`)
    .first<CrossLogTableColumns>()
    .then(r => (r?.id ?? 0) + 1)
}
