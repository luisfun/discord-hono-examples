import { Command } from 'discord-hono'
import { factory } from '../init.js'

export const command_hello = factory.command(new Command('hello', 'response world'), c => c.res('world'))
