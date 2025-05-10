import { Button, Command, Content, Layout } from 'discord-hono'
import { factory } from '../init.js'

export const command_help = factory.command(new Command('help', 'ヘルプ'), c =>
  c.flags('EPHEMERAL', 'IS_COMPONENTS_V2').res({
    components: [
      new Layout("Separator"),
      new Content('### /2ch\n- text: 文字を送信\n- image: 画像を送信'),
      new Layout("Separator"),
      new Content(
        '### クロス鯖\nクロスサーバーが設定されている場合、/2chコマンドで送信したメッセージが他のサーバーにも送信されます。',
      ),
      new Layout("Separator"),
      new Layout('Action Row').components(new Button('https://luis.fun', '開発者', 'Link')),
    ],
  }),
)
