import { channelType, makeChannelOption, makeSubCommand } from 'discord-hono'
import { factory } from '../../../init.js'

export const subcommand_meta = factory.subCommand(
  makeSubCommand('meta', 'Meta option').options([
    makeChannelOption('channel', 'Select a channel').required(true).channel_types([channelType.GUILD_TEXT]),
  ]),
  c => {
    const channel = c.ref.channels?.[c.var.channel]
    if (!channel) return c.res(`Channel not found`)
    return c.res(`ID: ${channel.id}\nName: ${channel.name}\nLink: <#${channel.id}>`)
  },
)
