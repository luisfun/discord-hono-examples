const maxLog = 100

/**
 * insert new message and delete old messages (max log 100)
 */
export const setCrossLog = (
  db: D1Database,
  cross_guild_id: string | undefined,
  guild_id: string | undefined,
  user_id: string | undefined,
  message: string | undefined,
) => {
  if (!cross_guild_id || !guild_id || !user_id) return
  return db.batch([
    db
      .prepare(`INSERT INTO _${cross_guild_id} (guild_id, user_id, message, created_at) VALUES (?, ?, ?, ?)`)
      .bind(guild_id, user_id, message ?? null, Date.now()),
    db.prepare(`
      DELETE FROM _${cross_guild_id}
      WHERE id IN (
        SELECT id
        FROM _${cross_guild_id}
        ORDER BY id ASC
        LIMIT GREATEST((SELECT COUNT(*) FROM _${cross_guild_id}) - ${maxLog}, 0)
      )
    `),
  ])
}
