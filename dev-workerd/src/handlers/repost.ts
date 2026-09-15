import { makeContainer, makeMessageCommand, makeTextDisplay } from 'discord-hono'
import { factory } from '../init.js'
/*
export const command_repost = factory.command(makeMessageCommand('repost'), c => {
  return c.flags('EPHEMERAL', 'IS_COMPONENTS_V2').resDefer(async c => {
    const res = await c
      .followup({
        components: [makeContainer([makeTextDisplay(c.ref.messages[c.ref.target_id]?.content || 'Error: not found')])],
      })
      .then(r => r.json())
    // @ts-expect-error
    console.log(res?.errors?.components?.['0'])
  })
})
*/

export const command_repost = factory.command(makeMessageCommand('repost'), c => {
  const { guild, channel } = c.interaction
  const { target_id } = c.ref
  return c.flags('IS_COMPONENTS_V2').res({
    components: [
      makeTextDisplay(guild ? `https://discord.com/channels/${guild.id}/${channel.id}/${target_id}` : 'Error'),
      makeContainer([makeTextDisplay(c.ref.messages[target_id]?.content || 'Error')]),
    ],
  })
})
