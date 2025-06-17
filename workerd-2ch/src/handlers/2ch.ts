import type { APIChatInputApplicationCommandInteractionData, APIMessage } from 'discord-api-types/v10'
import { Command, Content, Option, _channels_$_messages } from 'discord-hono'
import { getCrossGuild } from '../db/get-cross-guild.js'
import { getGuild } from '../db/get-guild.js'
import { getNextId } from '../db/get-next-id.js'
import { setCrossLog } from '../db/set-cross-log.js'
import { setGuild } from '../db/set-guild.js'
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
        const hashId = await toHashId(c.interaction.member?.user?.id ?? '')
        const url = (c.interaction.data as APIChatInputApplicationCommandInteractionData).resolved?.attachments?.[
          c.var.image ?? 0
        ]?.url

        // message json
        const flags = 1 << 15 // IS_COMPONENTS_V2
        const components = [
          new Content(`-# **${index}以下、VIPがお送りします：${time} ID:${hashId}**`),
          new Content(c.var.text),
          url ? new Content(url, 'Media Gallery') : null,
        ].filter(e => !!e)

        // send message
        let isPostError = !channels.includes(guild?.channel_id ?? c.interaction.channel.id)
        for (const channel of channels) {
          const res = (await c
            .rest('POST', _channels_$_messages, [channel], { flags, components })
            .then(r => r.json())) as APIMessage | { message: string; code: number }
          // チャンネルが不正の時、そのチャンネルをDBから削除。guildやcross_guildはそのまま保持。
          if ('message' in res && res.message === 'Unknown Channel') {
            isPostError = true
            const errorGuild = cross.find(e => e.channel_id === channel)
            if (errorGuild)
              await setGuild(
                c.env.DB,
                errorGuild?.guild_id,
                errorGuild?.guild_name,
                undefined,
                errorGuild?.cross_guild_id,
              )
          }
        }

        // set cross log
        await setCrossLog(
          c.env.DB,
          guild?.cross_guild_id,
          c.interaction.guild_id,
          c.interaction.member?.user?.id,
          c.var.text,
        )

        // delete followup message
        await c.followup(isPostError ? 'Warn: 一部のチャンネルに送信できませんでした。' : undefined)
        // biome-ignore lint: any
      } catch (e: any) {
        console.error(e)
        await c.followup(`Error: ${e.message}`)
      }
    }),
)

const toHashId = async (uid: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(new Date().toISOString().split('T')[0] + uid)),
    ),
  )
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 4) // 4-digit hash ID
