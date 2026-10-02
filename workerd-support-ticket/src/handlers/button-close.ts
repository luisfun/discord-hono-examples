import {
  $channels$_,
  $channels$_$messages,
  $guilds$_$roles$_,
  makeButton,
} from 'discord-hono'
import { factory } from '../init'
import { loc, normalizeLocale } from './i18n'
import {
  type CustomValues,
  channelPermission,
  type ModifyChannelJson,
  restError,
} from './utils'

export const button_close = factory.component(
  makeButton('c', ['🔒', loc.close.button['en-US']]),
  async c => {
    if (
      !c.ref.custom_value ||
      !c.interaction.guild ||
      !c.interaction.channel.name
    )
      return c.res('Reference Error: Contact the developer')
    const userLocale = normalizeLocale(c.interaction.locale)
    const [role, _open, closed] = JSON.parse(c.ref.custom_value) as CustomValues
    // JSON payload for modifying the channel
    const json: ModifyChannelJson = {
      name: c.interaction.channel.name.replace(/^open-/, 'closed-'),
      permission_overwrites: channelPermission(
        c.interaction.guild.id,
        c.env.DISCORD_APPLICATION_ID,
        null,
        role,
      ),
    }
    if (closed) json.parent_id = closed
    // Send the request to modify the channel
    const resModify = await c.rest(
      'PATCH',
      $channels$_,
      [c.interaction.channel.id],
      json,
    )
    // Error handling for channel modification response
    if (!resModify.ok) {
      let fallbackNotice = false
      let newRole = role
      let newClosed = closed
      const resRole = role
        ? await c.rest('GET', $guilds$_$roles$_, [c.interaction.guild.id, role])
        : null
      if (resRole && !resRole.ok) {
        fallbackNotice = true
        newRole = undefined
      }
      const resClosed = closed
        ? await c.rest('GET', $channels$_, [closed])
        : null
      if (resClosed && !resClosed.ok) {
        fallbackNotice = true
        newClosed = undefined
      }
      // JSON payload for modifying the channel
      const newJson: ModifyChannelJson = {
        permission_overwrites: channelPermission(
          c.interaction.guild.id,
          c.env.DISCORD_APPLICATION_ID,
          null,
          newRole,
        ),
      }
      if (newClosed) newJson.parent_id = newClosed
      // Send the request to modify the channel
      const resFallbackModify = await c.rest(
        'PATCH',
        $channels$_,
        [c.interaction.channel.id],
        newJson,
      )
      if (!resFallbackModify.ok)
        return c.res(
          await restError(resFallbackModify, 'Close > Fallback modify channel'),
        )
      if (fallbackNotice) {
        const resFallbackCloseMessage = await c.rest(
          'POST',
          $channels$_$messages,
          [c.interaction.channel.id],
          `${loc.close.finished[userLocale]}\n${loc.close.error[userLocale]}`,
        )
        if (!resFallbackCloseMessage.ok)
          return c.res(
            await restError(
              resFallbackCloseMessage,
              'Close > Fallback > Send message',
            ),
          )
        return c.update().resDefer(c => c.followup())
      }
    }
    // Return the interaction
    const resCloseMessage = await c.rest(
      'POST',
      $channels$_$messages,
      [c.interaction.channel.id],
      loc.close.finished[userLocale],
    )
    if (!resCloseMessage.ok)
      return c.res(await restError(resCloseMessage, 'Close > Send message'))
    return c.update().resDefer(c => c.followup())
  },
)
