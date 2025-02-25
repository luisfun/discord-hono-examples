import { Button, Command, Components } from 'discord-hono'
import { factory } from '../init.js'
import { component_delete } from './utils.js'

export const command_000 = factory.command(new Command('000-help', 'Documentation Link'), c =>
  c.res({
    components: new Components().row(
      new Button('https://discord-hono.luis.fun', ['📑', 'Docs'], 'Link'),
      component_delete.component,
    ),
  }),
)
