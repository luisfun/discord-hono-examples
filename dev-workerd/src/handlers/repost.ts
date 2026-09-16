import {
  makeContainer,
  makeMessageCommand,
  makeTextDisplay,
} from 'discord-hono'
import { factory } from '../init.js'

export const command_repost = factory.command(
  makeMessageCommand('repost'),
  c => {
    const { guild, channel } = c.interaction
    const { target_id } = c.ref
    return c.flags('IS_COMPONENTS_V2').res({
      components: [
        makeTextDisplay(
          guild
            ? `https://discord.com/channels/${guild.id}/${channel.id}/${target_id}`
            : 'Error',
        ),
        makeContainer([
          makeTextDisplay(c.ref.messages[target_id]?.content || 'Error'),
        ]),
      ],
    })
  },
)
