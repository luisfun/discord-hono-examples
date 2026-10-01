import type { Locale as APILocale } from 'discord-api-types/v10'
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

type Locale = Extract<APILocale, 'en-US' | 'ja'>

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
  },
  ticketClose: {
    message: {
      'en-US':
        '## Support Channel\nPress the button to close this support channel.',
      ja: '## お問い合わせチャンネル\nボタンを押すと、このお問い合わせチャンネルを閉じます。',
    },
    button: {
      'en-US': 'Close Ticket',
      ja: 'お問い合わせを閉じる',
    },
    finished: {
      'en-US': 'This support channel has been closed.',
      ja: 'このお問い合わせチャンネルは閉じられました。',
    },
  },
  error: {
    role: {
      'en-US': 'Support team role not found.',
      ja: 'サポートチームのロールが見つかりません。',
    },
    open: {
      'en-US':
        'Admin Notice\nOpen tickets category not found. Please reconfigure the ticket system.',
      ja: '管理者へ\nオープンチケットのカテゴリが見つかりません。チケットシステムを再設定してください。',
    },
    closed: {
      'en-US':
        'Closed tickets category or support team role not found. Fallback action was taken.',
      ja: 'クローズカテゴリまたはサポートチームのロールが見つからなかったため、フォールバック動作を行いました。',
    },
  },
} as const satisfies Record<string, Record<string, Record<Locale, string>>>

const restError = async (res: TypedResponse<any>, errorType: string) => {
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
      const userLocale = c.interaction.locale as Locale
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
            makeTextDisplay(
              loc.ticketOpen.message[userLocale] ??
                loc.ticketOpen.message['en-US'],
            ),
            makeActionRow([
              component_ticket_open.component
                .custom_value(customValue)
                .label(
                  loc.ticketOpen.button[userLocale] ??
                    loc.ticketOpen.button['en-US'],
                ),
            ]),
          ],
        },
      )
      if (res.ok) await c.followup()
      else
        await c.followup(
          await restError(res, 'Failed to create support channel'),
        )
    }),
)

type CreateChannelJson = RestData<'POST', typeof $guilds$_$channels>
type ModifyChannelJson = RestData<'PATCH', typeof $channels$_>

const channelPermission = (
  everyoneId: string,
  userId?: string | null,
  role?: string,
) => {
  const permission: ModifyChannelJson['permission_overwrites'] = [
    {
      id: everyoneId,
      type: 0,
      deny: permissionFlags('VIEW_CHANNEL').toString(),
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

export const component_ticket_open = factory.component(
  makeButton('to', ['🎫', loc.ticketOpen.button['en-US']]),
  async c => {
    if (!c.ref.custom_value || !c.interaction.guild || !c.interaction.user)
      return c.res('Reference Error: Contact the developer')
    const userLocale = c.interaction.locale as Locale
    const [role, open, _closed] = JSON.parse(c.ref.custom_value) as CustomValues
    // JSON payload for creating the channel
    const json: CreateChannelJson = {
      name: `open-0001`,
      type: channelType.GUILD_TEXT,
      permission_overwrites: channelPermission(
        c.interaction.guild.id,
        c.interaction.user.id,
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
      if (reconfigureNotice)
        return c.res(loc.error.open[userLocale] ?? loc.error.open['en-US'])
      else
        return c.res(
          await restError(resCreate, 'Failed to create open channel'),
        )
    }
    const openChannelId = (await resCreate.json()).id
    // Send close button
    let mention = `<@${c.interaction.user.id}>`
    if (role) mention += ` <@&${role}>`
    const resMessage = await c.rest(
      'POST',
      $channels$_$messages,
      [openChannelId],
      {
        flags: messageFlags('IS_COMPONENTS_V2'),
        components: [
          makeTextDisplay(
            loc.ticketClose.message[userLocale] ??
              loc.ticketClose.message['en-US'],
          ),
          makeActionRow([
            component_ticket_close.component.custom_value(c.ref.custom_value),
          ]),
          makeTextDisplay(mention),
        ],
      },
    )
    if (!resMessage.ok)
      return c.res(
        await restError(resMessage, 'Failed to send message in open channel'),
      )
    // Return the response to the user
    return c
      .flags('EPHEMERAL')
      .res(
        loc.ticketOpen.response[userLocale] ?? loc.ticketOpen.response['en-US'],
      )
  },
)

export const component_ticket_close = factory.component(
  makeButton('to', ['🔒', loc.ticketClose.button['en-US']]),
  async c => {
    if (!c.ref.custom_value || !c.interaction.guild)
      return c.res('Reference Error: Contact the developer')
    const userLocale = c.interaction.locale as Locale
    const [role, _open, closed] = JSON.parse(c.ref.custom_value) as CustomValues
    // JSON payload for modifying the channel
    const json: ModifyChannelJson = {
      permission_overwrites: channelPermission(
        c.interaction.guild.id,
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
      const json: ModifyChannelJson = {
        permission_overwrites: channelPermission(
          c.interaction.guild.id,
          null,
          newRole,
        ),
      }
      if (newClosed) json.parent_id = newClosed
      // Send the request to modify the channel
      const resRetryModify = await c.rest(
        'PATCH',
        $channels$_,
        [c.interaction.channel.id],
        json,
      )
      if (!resRetryModify.ok)
        return c.res(
          await restError(resRetryModify, 'Failed to modify the channel'),
        )
      if (fallbackNotice)
        return c.res(
          `${loc.ticketClose.finished[userLocale] ?? loc.ticketClose.finished['en-US']}\n${loc.error.closed[userLocale] ?? loc.error.closed['en-US']}`,
        )
    }
    // Return the interaction
    return c.res(
      loc.ticketClose.finished[userLocale] ?? loc.ticketClose.finished['en-US'],
    )
  },
)
