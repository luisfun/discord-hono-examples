import {
  buttonStyle,
  type CommandContext,
  type ComponentContext,
  makeActionRow,
  makeButton,
  makeContainer,
  makeSlashCommand,
  makeStringOption,
  makeTextDisplay,
} from 'discord-hono'
import { factory } from '../init'

const pageContent = (
  c: CommandContext<Env> | ComponentContext<Env>,
  page: number,
  text: string,
): Response =>
  c.flags('IS_COMPONENTS_V2').resDefer(async c => {
    ///// Process /////
    // const db = c.env.DB
    ///// Response Build /////
    const maxPage = 3
    const content = makeContainer([
      makeTextDisplay('## Content'),
      makeTextDisplay(text),
      makeTextDisplay(`Page: ${page}`),
    ])
    // Try hovering over `pagination`
    const pagination = makeActionRow([
      component_pagination_button.component
        .clone()
        .emoji({ name: '⬅️' } as const)
        .label('Previous')
        .custom_value(JSON.stringify([page - 1, text]))
        .disabled(page <= 1),
      component_pagination_button.component
        .clone()
        .emoji({ name: '➡️' } as const)
        .label('Next')
        .custom_value(JSON.stringify([page + 1, text]))
        .disabled(maxPage <= page),
    ])
    await c.followup({ components: [content, pagination] })
  })

export const command_pagination = factory.command(
  makeSlashCommand('pagination', 'Pagination').options([
    makeStringOption('text', 'page content').required(true),
  ]),
  c => pageContent(c, 1, c.var.text),
)

export const component_pagination_button = factory.component(
  makeButton('#pb', '').style(buttonStyle.Secondary),
  c => {
    const arr: [number, string] = c.ref.custom_value
      ? JSON.parse(c.ref.custom_value)
      : [1, 'Error']
    return pageContent(c.update(), ...arr)
  },
)
