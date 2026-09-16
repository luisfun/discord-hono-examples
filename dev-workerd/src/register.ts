import { register } from 'discord-hono'
import * as alpha from './alpha'
import { factory } from './init'
import * as handlers from './public'

register(
  factory.getCommands(Object.values({ ...alpha, ...handlers })),
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN,
  process.env.DISCORD_TEST_GUILD_ID,
)
