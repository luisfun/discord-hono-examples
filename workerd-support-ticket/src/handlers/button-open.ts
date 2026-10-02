import {
  $channels$_,
  $channels$_$messages,
  $guilds$_$channels,
  $guilds$_$roles$_,
  channelType,
  makeActionRow,
  makeButton,
  makeTextDisplay,
  messageFlags,
} from 'discord-hono'
import { factory } from '../init'
import { button_close } from './button-close'
import { loc, normalizeLocale } from './i18n'
import {
  type CreateChannelJson,
  type CustomValues,
  channelPermission,
  restError,
  toHashId,
} from './utils'

export const button_open = factory.component(
  makeButton('o', ['🎫', loc.open.button['en-US']]),
  async c => {
    if (!c.ref.custom_value || !c.interaction.guild || !c.interaction.member)
      return c.res('Reference Error: Contact the developer')
    const userLocale = normalizeLocale(c.interaction.locale)
    const [role, open, _closed] = JSON.parse(c.ref.custom_value) as CustomValues
    const isoTime = new Date().toISOString()
    // JSON payload for creating the channel
    const json: CreateChannelJson = {
      name: `open-${isoTime.split('T')[0].replaceAll('-', '')}-${await toHashId(isoTime + c.interaction.member.user.id)}`,
      type: channelType.GUILD_TEXT,
      permission_overwrites: channelPermission(
        c.interaction.guild.id,
        c.env.DISCORD_APPLICATION_ID,
        c.interaction.member.user.id,
        role,
      ),
    }
    if (open) json.parent_id = open
    // Send the request to create the channel
    const resCreate = await c.rest(
      'POST',
      $guilds$_$channels,
      [c.interaction.guild.id],
      json,
    )
    // Error handling for channel creation response
    if (!resCreate.ok) {
      let reconfigureNotice = false
      const resOpen = open ? await c.rest('GET', $channels$_, [open]) : null
      if (resOpen && !resOpen.ok) reconfigureNotice = true
      const resRole = role
        ? await c.rest('GET', $guilds$_$roles$_, [c.interaction.guild.id, role])
        : null
      if (resRole && !resRole.ok) reconfigureNotice = true
      if (reconfigureNotice) return c.res(loc.open.error[userLocale])
      return c.res(await restError(resCreate, 'Open > Create channel'))
    }
    const openChannelId = (await resCreate.json()).id
    // Send close button
    let mention = `<@${c.interaction.member.user.id}>`
    if (role) mention += ` <@&${role}>`
    const resMessage = await c.rest(
      'POST',
      $channels$_$messages,
      [openChannelId],
      {
        flags: messageFlags('IS_COMPONENTS_V2'),
        components: [
          makeTextDisplay(loc.close.message[userLocale]),
          makeActionRow([
            button_close.component
              .custom_value(c.ref.custom_value)
              .label(loc.close.button[userLocale]),
          ]),
          makeTextDisplay(mention),
        ],
      },
    )
    if (!resMessage.ok)
      return c.res(
        await restError(resMessage, 'Open > Send message in new channel'),
      )
    // Return the response to the user
    return c.flags('EPHEMERAL').res(loc.open.response[userLocale])
  },
)
