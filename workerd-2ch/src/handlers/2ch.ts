import type { APIChatInputApplicationCommandInteractionData } from 'discord-api-types/v10'
import { Command, Content, Option, _channels_$_messages } from 'discord-hono'
import { factory } from '../init.js'

export const command_2ch = factory.command<{ text: string; image?: string }>(
  new Command('2ch', '匿名メッセージ').options(
    new Option('text', '文字').required(),
    new Option('image', '画像', 'Attachment'),
  ),
  async c =>
    c.flags('EPHEMERAL').resDefer(async c => {
      await c.followup()
      const channels = [c.interaction.channel.id]
      const { text, image } = c.var
      const time = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }).replace(/\//g, '-')
      const imageURL = (c.interaction.data as APIChatInputApplicationCommandInteractionData).resolved?.attachments?.[
        image ?? 0
      ]?.url
      for (const channel of channels) {
        await c.rest('POST', _channels_$_messages, [channel], {
          flags: 1 << 15, // IS_COMPONENTS_V2
          components: [
            new Content(`-# **123：以下、VIPがお送りします：${time}**`),
            new Content(text),
            imageURL ? new Content(imageURL, 'Media Gallery') : null,
          ].filter(e => !!e),
        })
      }
    }),
)
