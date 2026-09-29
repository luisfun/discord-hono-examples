import {
  $channels$_$messages,
  // $interactions$_$_$callback,
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
} from 'discord-hono'
import { factory } from '../init'

type CustomValues = [
  role: string | undefined,
  open: string | undefined,
  closed: string | undefined,
  archived: string | undefined,
]

const Texts = {
  ticketTitle: 'Support',
  ticketDescription: 'To create a ticket, press the button',
  ticketButtonLabel: 'Create Ticket',
}

export const command_ticket_setup = factory.command(
  makeSlashCommand('ticket-setup', 'Setup a new ticket system').options([
    makeChannelOption('channel', 'Channel to post ticket information')
      .channel_types([channelType.GUILD_TEXT])
      .required(true),
    makeStringOption('title', 'Title of the ticket system'),
    makeStringOption('description', 'Description of the ticket system'),
    makeStringOption('button', 'Label of the ticket button'),
    makeRoleOption('role', 'Support Team Role'),
    makeChannelOption('open', 'Open Tickets Category').channel_types([
      channelType.GUILD_CATEGORY,
    ]),
    makeChannelOption('closed', 'Closed Tickets Category').channel_types([
      channelType.GUILD_CATEGORY,
    ]),
    makeChannelOption('archived', 'Archived Tickets Channel').channel_types([
      channelType.GUILD_TEXT,
    ]),
  ]),
  c =>
    c.flags('EPHEMERAL').resDefer(async c => {
      const customValue = JSON.stringify([
        c.var.role,
        c.var.open,
        c.var.closed,
        c.var.archived,
      ] as const satisfies CustomValues)
      const res = await c.rest('POST', $channels$_$messages, [c.var.channel], {
        flags: messageFlags('IS_COMPONENTS_V2'),
        components: [
          makeTextDisplay(
            `## ${c.var.title ?? Texts.ticketTitle}\n${c.var.description ?? Texts.ticketDescription}`,
          ),
          makeActionRow([
            component_ticket_button.component.custom_value(customValue),
          ]),
        ],
      })
      if (res.ok) await c.followup()
      else {
        const debug = await inspectResponse(res)
        console.error(debug.text)
        await c.followup(`## Error\n${debug.message}`)
      }
    }),
)

export const component_ticket_button = factory.component(
  makeButton('#t', ['🎫', Texts.ticketButtonLabel]),
  async c => {
    if (!c.ref.custom_value) return c.res('Error: Missing custom value')
    const [role, open, closed, archived] = JSON.parse(
      c.ref.custom_value,
    ) as CustomValues
    // return c.update().resDefer(c => c.followup())
    // test
    return c.res(
      `Role: ${role}\nOpen: ${open}\nClosed: ${closed}\nArchived: ${archived}`,
    )
  },
)
