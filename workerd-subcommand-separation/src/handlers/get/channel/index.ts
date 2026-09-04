import { makeSubCommandGroup } from 'discord-hono'
import { factory } from '../../../init.js'

import * as meta from './meta.js'

// export { component_something } from './meta.js' // If a component exists, re-export only that component. Re-exporting everything causes subcommands to be registered multiple times.

const handlers = Object.values({ ...meta })

export const subcommand_group_channel = factory.subCommandGroup(
  makeSubCommandGroup('channel', 'Channel group').options(factory.getSubCommands(handlers)),
  factory.subLoader(handlers),
)
