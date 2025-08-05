import type { APIChatInputApplicationCommandInteractionData } from 'discord-api-types/v10'
import { _channels_$_messages, Command, Content, Option } from 'discord-hono'
import { getCrossGuild } from '../db/get-cross-guild.js'
import { getGuild } from '../db/get-guild.js'
import { getNextId } from '../db/get-next-id.js'
import { setCrossLog } from '../db/set-cross-log.js'
import { setGuild } from '../db/set-guild.js'
import { factory } from '../init.js'

export const command_2ch = factory.command(
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
        const name = '名無しさん'
        const time = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        const hashId = await toHashId(time.split(' ')[0] + c.interaction.member?.user?.id)
        const image = (c.interaction.data as APIChatInputApplicationCommandInteractionData).resolved?.attachments?.[
          c.var.image ?? 0
        ]

        // message json
        const flags = 1 << 15 // IS_COMPONENTS_V2
        const components = [
          new Content(`-# **${index}${name}：${time} ID:${hashId}**`), // flavor text
          new Content(c.var.text),
          image ? new Content(`attachment://${image.filename}`, 'Media Gallery') : null,
        ].filter(e => !!e)
        const file = image
          ? {
              blob: new Blob([await fetch(image.url).then(r => r.arrayBuffer())]),
              name: image.filename,
            }
          : undefined

        // send message
        const errorArray = await Promise.all(
          channels.map(async channel => {
            const res = await c
              .rest('POST', _channels_$_messages, [channel], { flags, components }, file)
              .then(r => r.json())
            // チャンネルが不正の時、そのチャンネルをDBから削除。guildやcross_guildはそのまま保持。
            if ('message' in res && res.message === 'Unknown Channel') {
              const errorGuild = cross.find(e => e.channel_id === channel)
              if (errorGuild)
                await setGuild(
                  c.env.DB,
                  errorGuild?.guild_id,
                  errorGuild?.guild_name,
                  undefined,
                  errorGuild?.cross_guild_id,
                )
              return true // error
            }
            return false // success
          }),
        )
        const isPostError =
          !channels.includes(guild?.channel_id ?? c.interaction.channel.id) || errorArray.some(Boolean)

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

const toHashId = async (str: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 4) // 4-digit hash ID
