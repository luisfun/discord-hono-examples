import {
  $channels$_$messages,
  makeActionRow,
  makeBooleanOption,
  makeSlashCommand,
  responseDebug,
} from 'discord-hono'

import { factory } from '../init.js'

export const command_response_debug = factory.command(
  makeSlashCommand('response-debug', 'Response debug').options([
    makeBooleanOption('error', '意図的にエラーを発生させる'),
  ]),
  c =>
    c.resDefer(async c => {
      // follow-up形式にし、レスポンスを取得
      const res = await c.followup(
        c.var.error
          ? {
              content: 'e'.repeat(2001),
              components: [makeActionRow([component_response_debug.component])],
            }
          : '正常なレスポンス',
      )

      // debug用テキストを作成
      const debug = await responseDebug(res)
      console.log(debug.text)

      // エラー場合はチャンネルに投稿
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
