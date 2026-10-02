import {
  $channels$_$messages,
  channelType,
  makeActionRow,
  makeChannelOption,
  makeRoleOption,
  makeSlashCommand,
  makeTextDisplay,
  messageFlags,
} from 'discord-hono'
import { factory } from '../init'
import { component_ticket_open } from './button-open'
import { loc, normalizeLocale } from './i18n'
import { type CustomValues, restError } from './utils'

export const command_ticket_setup = factory.command(
  makeSlashCommand('ticket-setup', loc.cmd.description['en-US'])
    .description_localizations(loc.cmd.description)
    .options([
      makeChannelOption('channel', loc.cmd.optionChannel['en-US'])
        .description_localizations(loc.cmd.optionChannel)
        .channel_types([channelType.GUILD_TEXT]),
      makeRoleOption(
        'role',
        loc.cmd.optionRole['en-US'],
      ).description_localizations(loc.cmd.optionRole),
      makeChannelOption('open', loc.cmd.optionOpen['en-US'])
        .description_localizations(loc.cmd.optionOpen)
        .channel_types([channelType.GUILD_CATEGORY]),
      makeChannelOption('closed', loc.cmd.optionClosed['en-US'])
        .description_localizations(loc.cmd.optionClosed)
        .channel_types([channelType.GUILD_CATEGORY]),
    ]),
  c =>
    c.flags('EPHEMERAL').resDefer(async c => {
      const userLocale = normalizeLocale(c.interaction.locale)
      const customValue = JSON.stringify([
        c.var.role,
        c.var.open,
        c.var.closed,
      ] as const satisfies CustomValues)
      const res = await c.rest(
        'POST',
        $channels$_$messages,
        [c.var.channel ?? c.interaction.channel.id],
        {
          flags: messageFlags('IS_COMPONENTS_V2'),
          components: [
            makeTextDisplay(loc.ticketOpen.message[userLocale]),
            makeActionRow([
              component_ticket_open.component
                .custom_value(customValue)
                .label(loc.ticketOpen.button[userLocale]),
            ]),
          ],
        },
      )
      if (res.ok) await c.followup()
      else await c.followup(await restError(res, 'Setup > POST message'))
    }),
)
