import { makeSlashCommand } from 'discord-hono'
import { factory } from '../../init.js'

import * as channel from './channel/index.js'
import * as help from './help.js'

// export * from './channel/index.js' // No need to re-export when the component is not included
export * from './help.js' // Re-export is required because this file includes components

const handlers = Object.values({ ...channel, ...help })

export const command_get = factory.command(
  makeSlashCommand('get', 'Get Command').options(factory.getSubCommands(handlers)),
  factory.subLoader(handlers),
)
