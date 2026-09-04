import { buttonStyle, makeButton } from 'discord-hono'
import { factory } from '../init.js'

export const component_delete = factory.component(
  makeButton('delete', ['🗑️', 'Delete']).style(buttonStyle.Secondary),
  c => c.update().resDefer(c => c.followup()),
)
