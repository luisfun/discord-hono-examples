import { Button, Command, Components, Option } from 'discord-hono'
import { factory } from '../init.js'
import { component_delete } from './utils.js'

type Var = { text?: string }

export const command_help = factory.command<Var>(
  new Command('help', 'response help').options(new Option('text', 'with text')),
  c =>
    c.res({
      content: `text: ${c.var.text}\n${c.interaction.guild_id}`,
      components: new Components().row(
        new Button('https://discord-hono.luis.fun', ['📑', 'Docs'], 'Link'),
        component_delete.component,
      ),
    }),
)
