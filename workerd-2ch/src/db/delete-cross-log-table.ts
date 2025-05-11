export const deleteCrossLogTable = (db: D1Database, cross_guild_id: string | undefined) => {
  if (!cross_guild_id) throw new Error('cross_guild_id is undefined')
  return db.prepare(`DROP TABLE IF EXISTS _${cross_guild_id}`).run()
}
