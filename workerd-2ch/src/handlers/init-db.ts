import { Command } from 'discord-hono'
import { createGuildTable } from '../db/create-guild-table.js'
import { factory } from '../init.js'

export const command_init_db = factory.command(new Command('init-db', 'データベースの初期化'), c =>
  c.resDefer(async c => {
    try {
      if (!c.env.DB) throw new Error('DB is not defined')
      const res = await createGuildTable(c.env.DB)
      await c.followup(JSON.stringify(res, null, 2))
      // biome-ignore lint: any
    } catch (e: any) {
      await c.followup(`Error: ${e.message}`)
    }
  }),
)
