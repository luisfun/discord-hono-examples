import { makeSlashCommand } from 'discord-hono'
import { factory } from '../../init'

import * as hello from './hello'

//export * from './hello'

const handlers = Object.values({ ...hello })

export const command_public = factory.command(
  makeSlashCommand('public', 'Public').options(factory.getSubCommands(handlers)),
  factory.subLoader(handlers),
)
