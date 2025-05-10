export const hasCrossGuild = (db: D1Database, guild_id: string) =>
  db.prepare('SELECT * FROM cross_guild WHERE guild_id = ?').bind(guild_id).run()
