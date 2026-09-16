import { makeSlashCommand } from 'discord-hono'
import { factory } from '../init'

export const command_hello = factory.command(
  makeSlashCommand('hello', 'Hello, world!'),
  c => c.res('Hello, alpha!'),
)
