import { makeSlashCommand, makeStringOption, register } from 'discord-hono'

const commands = [
  makeSlashCommand('hello', 'Hello, World!').options([makeStringOption('name', 'Your name')]),
  makeSlashCommand('help', 'Docs URL'),
]

register(
  commands,
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN,
  // process.env.DISCORD_TEST_GUILD_ID,
)
