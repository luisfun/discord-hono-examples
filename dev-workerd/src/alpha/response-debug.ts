import {
  $channels$_$messages,
  inspectResponse,
  makeActionRow,
  makeBooleanOption,
  makeSlashCommand,
} from 'discord-hono'

import { factory } from '../init.js'

export const command_response_debug = factory.command(
  makeSlashCommand('response-debug', 'Response debug').options([
    makeBooleanOption('error', 'Intentionally trigger an error'),
  ]),
  c =>
    c.resDefer(async c => {
      // Use the follow-up format and retrieve the response
      const res = await c.followup(
        c.var.error
          ? {
              content: 'e'.repeat(2001),
              components: [makeActionRow([component_response_debug.component])],
            }
          : 'Successful response',
      )

      // Create debug text
      const debug = await inspectResponse(res)
      console.log(debug.text)

      // Post to the channel on error
      if (!res.ok) {
        await c.rest(
          'POST',
          $channels$_$messages,
          [c.interaction.channel.id],
          debug.message,
        )
      }
    }),
)

export const component_response_debug = factory.component(
  { type: 2, custom_id: 'e'.repeat(101), style: 1 },
  c => c.res('debug'),
)
