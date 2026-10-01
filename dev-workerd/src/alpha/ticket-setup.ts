import type { Locale } from 'discord-api-types/v10'
import {
  $channels$_,
  $channels$_$messages,
  $guilds$_$channels,
  $guilds$_$roles$_,
  channelType,
  inspectResponse,
  makeActionRow,
  makeButton,
  makeChannelOption,
  makeRoleOption,
  makeSlashCommand,
  makeTextDisplay,
  messageFlags,
  permissionFlags,
  type RestData,
  type TypedResponse,
} from 'discord-hono'
import { factory } from '../init'

type CustomValues = [
  role: string | undefined,
  open: string | undefined,
  closed: string | undefined,
]

type SupportedLocale = Locale.EnglishUS | Locale.Japanese

const loc = {
  cmd: {
    description: {
      'en-US': 'Setup a new ticket system',
      ja: '新しいチケットシステムを設定',
    },
    optionChannel: {
      'en-US': 'Channel to post ticket information',
      ja: 'チケット情報を投稿するチャンネル',
    },
    optionRole: {
      'en-US': 'Support Team Role',
      ja: 'サポートチームのロール',
    },
    optionOpen: {
      'en-US': 'Open Tickets Category',
      ja: 'オープンチケットのカテゴリ',
    },
    optionClosed: {
      'en-US': 'Closed Tickets Category',
      ja: 'クローズドチケットのカテゴリ',
    },
  },
  ticketOpen: {
    message: {
      'en-US': '## Support\nPress the button to create a support channel.',
      ja: '## お問い合わせ\nボタンを押すと、お問い合わせチャンネルが作成されます。',
    },
    button: {
      'en-US': 'Create Ticket',
      ja: 'お問い合わせを作成',
    },
    response: {
      'en-US': 'Created a support channel. Please check it.',
      ja: 'お問い合わせチャンネルを作成しました。確認してください。',
    },
    error: {
      'en-US':
        'Admin Notice\nOpen tickets category not found. Please reconfigure the ticket system.',
      ja: '管理者へ\nオープンチケットのカテゴリが見つかりません。チケットシステムを再設定してください。',
    },
  },
  ticketClose: {
    message: {
      'en-US':
        '## Support Channel\nPress the button to close this support channel.',
      ja: '## お問い合わせチャンネル\nボタンを押すと、このお問い合わせを閉じます。',
    },
    button: {
      'en-US': 'Close Ticket',
      ja: 'お問い合わせを閉じる',
    },
    finished: {
      'en-US': 'This support has been closed.',
      ja: 'このお問い合わせは閉じられました。',
    },
    error: {
      'en-US':
        'Closed tickets category or support team role not found. Fallback action was taken.',
      ja: 'クローズカテゴリまたはサポートチームのロールが見つからなかったため、フォールバック動作を行いました。',
    },
  },
} as const satisfies Record<
  string,
  Record<string, Record<SupportedLocale, string>>
>

const normalizeLocale = (locale: Locale) => {
  if (Object.keys(loc.cmd.description).includes(locale))
    return locale as SupportedLocale
  return 'en-US'
}

const restError = async (res: TypedResponse<unknown>, errorType: string) => {
  const debug = await inspectResponse(res)
  console.error(debug.text)
  return `### Error: Contact the developer\n${errorType}\n\`\`\`${debug.message}\`\`\``
}

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

type CreateChannelJson = RestData<'POST', typeof $guilds$_$channels>
type ModifyChannelJson = RestData<'PATCH', typeof $channels$_>

const channelPermission = (
  everyoneId: string,
  botId: string,
  userId?: string | null,
  role?: string,
) => {
  const permission: ModifyChannelJson['permission_overwrites'] = [
    {
      id: everyoneId,
      type: 0,
      deny: permissionFlags('VIEW_CHANNEL').toString(),
    },
    {
      id: botId,
      type: 1,
      allow: permissionFlags('VIEW_CHANNEL', 'SEND_MESSAGES').toString(),
    },
  ]
  if (userId)
    permission.push({
      id: userId,
      type: 1,
      allow: permissionFlags('VIEW_CHANNEL', 'SEND_MESSAGES').toString(),
    })
  if (role)
    permission.push({
      id: role,
      type: 0,
      allow: permissionFlags('VIEW_CHANNEL', 'SEND_MESSAGES').toString(),
    })
  return permission
}

const toHashId = async (str: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)),
    ),
  )
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 4) // 4-digit hash ID

export const component_ticket_open = factory.component(
  makeButton('to', ['🎫', loc.ticketOpen.button['en-US']]),
  async c => {
    if (!c.ref.custom_value || !c.interaction.guild || !c.interaction.member)
      return c.res('Reference Error: Contact the developer')
    const userLocale = normalizeLocale(c.interaction.locale)
    const [role, open, _closed] = JSON.parse(c.ref.custom_value) as CustomValues
    const isoTime = new Date().toISOString()
    // JSON payload for creating the channel
    const json: CreateChannelJson = {
      name: `open-${isoTime.split('T')[0].replaceAll('-', '').substring(2)}-${await toHashId(isoTime + c.interaction.member.user.id)}`,
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
      if (reconfigureNotice) return c.res(loc.ticketOpen.error[userLocale])
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
          makeTextDisplay(loc.ticketClose.message[userLocale]),
          makeActionRow([
            component_ticket_close.component
              .custom_value(c.ref.custom_value)
              .label(loc.ticketClose.button[userLocale]),
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
    return c.flags('EPHEMERAL').res(loc.ticketOpen.response[userLocale])
  },
)

export const component_ticket_close = factory.component(
  makeButton('tc', ['🔒', loc.ticketClose.button['en-US']]),
  async c => {
    if (!c.ref.custom_value || !c.interaction.guild)
      return c.res('Reference Error: Contact the developer')
    const userLocale = normalizeLocale(c.interaction.locale)
    const [role, _open, closed] = JSON.parse(c.ref.custom_value) as CustomValues
    // JSON payload for modifying the channel
    const json: ModifyChannelJson = {
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
          `${loc.ticketClose.finished[userLocale]}\n${loc.ticketClose.error[userLocale]}`,
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
      loc.ticketClose.finished[userLocale],
    )
    if (!resCloseMessage.ok)
      return c.res(await restError(resCloseMessage, 'Close > Send message'))
    return c.update().resDefer(c => c.followup())
  },
)
