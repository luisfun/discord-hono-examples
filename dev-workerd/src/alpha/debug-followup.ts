import { inspectResponse, makeActionRow, makeSlashCommand } from 'discord-hono'

import { factory } from '../init.js'

export const command_debug_followup = factory.command(
  makeSlashCommand('debug-followup', 'Debug Followup'),
  c =>
    c.resDefer(async c => {
      const res = await c.followup({
        content: 'e'.repeat(2001),
        components: [makeActionRow([component_debug_followup.component])],
      })

      const debug = await inspectResponse(res)
      console.log(debug.text)
    }),
)

export const component_debug_followup = factory.component(
  { type: 2, custom_id: 'e'.repeat(101), style: 1 },
  c => c.res('debug'),
)
