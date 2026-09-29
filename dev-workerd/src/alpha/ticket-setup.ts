import type { Locale as APILocale } from 'discord-api-types/v10'
import {
  $channels$_$messages,
  type $guilds$_$channels,
  channelType,
  inspectResponse,
  makeActionRow,
  makeButton,
  makeChannelOption,
  makeRoleOption,
  makeSlashCommand,
  makeStringOption,
  makeTextDisplay,
  messageFlags,
  permissionFlags,
  type RestData,
} from 'discord-hono'
import { factory } from '../init'

type CustomValues = [
  role: string | undefined,
  open: string | undefined,
  closed: string | undefined,
  archived: string | undefined,
]

type Locale = Extract<APILocale, 'en-US' | 'ja'>

const loc = {
  desc: {
    command: {
      'en-US': 'Setup a new ticket system',
      ja: '新しいチケットシステムを設定',
    },
    optionChannel: {
      'en-US': 'Channel to post ticket information',
      ja: 'チケット情報を投稿するチャンネル',
    },
    optionTitle: {
      'en-US': 'Title of the ticket system',
      ja: 'チケットシステムのタイトル',
    },
    optionDescription: {
      'en-US': 'Description of the ticket system',
      ja: 'チケットシステムの説明',
    },
    optionButton: {
      'en-US': 'Label of the ticket button',
      ja: 'チケットボタンのラベル',
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
    optionArchived: {
      'en-US': 'Archived Tickets Channel',
      ja: 'アーカイブ済みチケットのチャンネル',
    },
  },
  ticketEntry: {
    title: {
      'en-US': 'Support',
      ja: 'お問い合わせ',
    },
    description: {
      'en-US': 'Press the button to create a support channel.',
      ja: 'ボタンを押すと、お問い合わせチャンネルが作成されます。',
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
} as const satisfies Record<string, Record<string, Record<Locale, string>>>

export const command_ticket_setup = factory.command(
  makeSlashCommand('ticket-setup', loc.desc.command['en-US'])
    .description_localizations(loc.desc.command)
    .options([
      makeChannelOption('channel', loc.desc.optionChannel['en-US'])
        .description_localizations(loc.desc.optionChannel)
        .channel_types([channelType.GUILD_TEXT]),
      makeStringOption(
        'title',
        loc.desc.optionTitle['en-US'],
      ).description_localizations(loc.desc.optionTitle),
      makeStringOption(
        'description',
        loc.desc.optionDescription['en-US'],
      ).description_localizations(loc.desc.optionDescription),
      makeStringOption(
        'button',
        loc.desc.optionButton['en-US'],
      ).description_localizations(loc.desc.optionButton),
      makeRoleOption(
        'role',
        loc.desc.optionRole['en-US'],
      ).description_localizations(loc.desc.optionRole),
      makeChannelOption('open', loc.desc.optionOpen['en-US'])
        .description_localizations(loc.desc.optionOpen)
        .channel_types([channelType.GUILD_CATEGORY]),
      makeChannelOption('closed', loc.desc.optionClosed['en-US'])
        .description_localizations(loc.desc.optionClosed)
        .channel_types([channelType.GUILD_CATEGORY]),
      makeChannelOption('archived', loc.desc.optionArchived['en-US'])
        .description_localizations(loc.desc.optionArchived)
        .channel_types([channelType.GUILD_TEXT]),
    ]),
  c =>
    c.flags('EPHEMERAL').resDefer(async c => {
      const userLocale = c.interaction.locale as Locale
      const customValue = JSON.stringify([
        c.var.role,
        c.var.open,
        c.var.closed,
        c.var.archived,
      ] as const satisfies CustomValues)
      const res = await c.rest(
        'POST',
        $channels$_$messages,
        [c.var.channel ?? c.interaction.channel.id],
        {
          flags: messageFlags('IS_COMPONENTS_V2'),
          components: [
            makeTextDisplay(
              `## ${c.var.title ?? loc.ticketEntry.title[userLocale] ?? loc.ticketEntry.title['en-US']}\n${c.var.description ?? loc.ticketEntry.description[userLocale] ?? loc.ticketEntry.description['en-US']}`,
            ),
            makeActionRow([
              component_ticket_button.component
                .custom_value(customValue)
                .label(
                  c.var.button ??
                    loc.ticketEntry.button[userLocale] ??
                    loc.ticketEntry.button['en-US'],
                ),
            ]),
          ],
        },
      )
      if (res.ok) await c.followup()
      else {
        const debug = await inspectResponse(res)
        console.error(debug.text)
        await c.followup(`## Error\n${debug.message}`)
      }
    }),
)

type CreateChannelJson = RestData<'POST', typeof $guilds$_$channels>

export const component_ticket_button = factory.component(
  makeButton('#t', ['🎫', loc.ticketEntry.button['en-US']]),
  async c => {
    if (!c.ref.custom_value || !c.interaction.guild || !c.interaction.user)
      return c.res('Bot Error: Contact the developer')
    const userLocale = c.interaction.locale as Locale
    const [role, open, closed, archived] = JSON.parse(
      c.ref.custom_value,
    ) as CustomValues
    // Channel permission overwrites setup
    const permission_overwrites: CreateChannelJson['permission_overwrites'] = [
      {
        id: c.interaction.guild.id,
        type: 0,
        deny: permissionFlags('VIEW_CHANNEL').toString(),
      },
      {
        id: c.interaction.user.id,
        type: 1,
        allow: permissionFlags('VIEW_CHANNEL', 'SEND_MESSAGES').toString(),
      },
    ]
    if (role) {
      permission_overwrites.push({
        id: role,
        type: 0,
        allow: permissionFlags('VIEW_CHANNEL', 'SEND_MESSAGES').toString(),
      })
    }
    // JSON payload for creating the channel
    const json: CreateChannelJson = {
      name: `open-0001`,
      type: channelType.GUILD_TEXT,
      permission_overwrites,
    }
    if (open) json.parent_id = open
    return c
      .flags('EPHEMERAL')
      .res(
        loc.ticketEntry.response[userLocale] ??
          loc.ticketEntry.response['en-US'],
      )
  },
)
