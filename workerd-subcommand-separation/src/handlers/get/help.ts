import { buttonStyle, makeActionRow, makeButton, makeSubCommand } from 'discord-hono'
import { factory } from '../../init.js'

export const subcommand_help = factory.subCommand(makeSubCommand('help', 'Get Help'), c =>
  c.res({
    content: 'Get help',
    components: [makeActionRow([component_get_help_update.component.custom_value('1')])],
  }),
)

export const component_get_help_update = factory.component(
  makeButton('get_help_update', 'Update Help').style(buttonStyle.Secondary),
  (c): Response =>
    c.res({
      content: `Help update clicked +${c.ref.custom_value ?? 0}`,
      components: [
        makeActionRow([component_get_help_update.component.custom_value(String(Number(c.ref.custom_value ?? 0) + 1))]),
      ],
    }),
)
