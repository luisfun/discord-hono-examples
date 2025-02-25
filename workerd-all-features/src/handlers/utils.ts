import { Button } from 'discord-hono'
import { factory } from '../init.js'

export const component_delete = factory.component(new Button('delete', ['🗑️', 'Delete'], 'Secondary'), c =>
  c.resDeferUpdate(c.followupDelete),
)
