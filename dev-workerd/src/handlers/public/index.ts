import { makeSlashCommand } from 'discord-hono'
import { factory } from '../../init'

import * as hello from './hello'
import * as pagination from './pagination'
import * as poll from './poll'

export * from './pagination'

const handlers = Object.values({ ...hello, ...pagination, ...poll })

export const command_public = factory.command(
  makeSlashCommand('public', 'Public').options(
    factory.getSubCommands(handlers),
  ),
  factory.subLoader(handlers),
)
