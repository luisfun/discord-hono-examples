import { makeActionRow, makeLinkButton, makeSlashCommand } from 'discord-hono'
import { factory } from '../init.js'
import { component_delete } from './utils.js'

export const command_help = factory.command(makeSlashCommand('help', 'response help'), c =>
  c.res({
    components: [
      makeActionRow([makeLinkButton('https://discord-hono.luis.fun', ['📑', 'Docs']), component_delete.component]),
    ],
  }),
)
