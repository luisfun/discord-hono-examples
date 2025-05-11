import type { APIChatInputApplicationCommandInteractionData } from 'discord-api-types/v10'
import { Command, Content, Option, _channels_$_messages } from 'discord-hono'
import { getCrossGuild } from '../db/get-cross-guild.js'
import { getGuild } from '../db/get-guild.js'
import { getNextId } from '../db/get-next-id.js'
import { setCrossLog } from '../db/set-cross-log.js'
import { factory } from '../init.js'

export const command_2ch = factory.command<{ text: string; image?: string }>(
  new Command('2ch', '匿名メッセージ').options(
    new Option('text', '文字').required(),
    new Option('image', '画像', 'Attachment'),
  ),
  async c =>
    c.flags('EPHEMERAL').resDefer(async c => {
      try {
        //if (!c.env.DB) throw new Error('DB is not defined')
        // get database data
        const guild = await getGuild(c.env.DB, c.interaction.guild_id)
        const cross = await getCrossGuild(c.env.DB, guild?.cross_guild_id)
        const nextId = await getNextId(c.env.DB, guild?.cross_guild_id)

        // message item
        const channels = cross[0]
          ? (cross.map(e => e.channel_id).filter(e => !!e) as string[])
          : [guild?.channel_id ?? c.interaction.channel.id]
        const index = nextId ? `${nextId}：` : ''
        const time = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        const url = (c.interaction.data as APIChatInputApplicationCommandInteractionData).resolved?.attachments?.[
          c.var.image ?? 0
        ]?.url

        // message json
        const flags = 1 << 15 // IS_COMPONENTS_V2
        const components = [
          new Content(`-# **${index}以下、VIPがお送りします：${time}**`),
          new Content(c.var.text),
          url ? new Content(url, 'Media Gallery') : null,
        ].filter(e => !!e)

        // send message
        for (const channel of channels) await c.rest('POST', _channels_$_messages, [channel], { flags, components })

        // set cross log
        await setCrossLog(c.env.DB, guild?.cross_guild_id, c.interaction.guild_id, c.interaction.user?.id, c.var.text)

        // delete followup message
        await c.followup()
        // biome-ignore lint: any
      } catch (e: any) {
        console.error(e)
        await c.followup(`Error: ${e.message}`)
      }
    }),
)
