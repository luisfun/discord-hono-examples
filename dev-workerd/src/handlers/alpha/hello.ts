import { makeSubCommand } from 'discord-hono'
import { factory } from '../../init'

export const sub_alpha_hello = factory.subCommand(makeSubCommand('hello', 'response world'), c => c.res('Hello, alpha world!'))
