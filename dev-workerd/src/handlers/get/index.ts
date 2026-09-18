import { makeSlashCommand } from 'discord-hono'
import { factory } from '../../init'

import * as channel from './channel'
import * as help from './help'

// export * from './channel' // No need to re-export when the component is not included
export * from './help' // Re-export is required because this file includes components

const handlers = Object.values({ ...channel, ...help })

export const command_get = factory.command(
  makeSlashCommand('get', 'Get Command').options(
    factory.getSubCommands(handlers),
  ),
  factory.subLoader(handlers),
)
