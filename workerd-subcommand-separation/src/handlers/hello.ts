import { makeSlashCommand, makeStringOption } from 'discord-hono'
import { factory } from '../init.js'

export const command_hello = factory.command(
  makeSlashCommand('hello', 'Hello, World!').options([makeStringOption('name', 'Your name')]),
  c => c.res(`Hello, ${c.var.name ?? 'World'}!`),
)
