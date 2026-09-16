import {
  makeActionRow,
  makeChannelSelect,
  makeLabel,
  makeModal,
  makeSlashCommand,
  makeStringOption,
  makeTextDisplay,
  makeTextInput,
} from 'discord-hono'
import { factory } from '../init'

export const command_modal = factory.command(
  makeSlashCommand('modal', 'Modal test').options([
    makeStringOption('text', 'with text'),
  ]),
  c => {
    if (!c.var.text) return c.resModal(modal_modal.modal)
    const modal = modal_modal.modal.toJSON()
    return c.resModal(
      makeModal(modal.custom_id, modal.title, [
        ...modal.components,
        makeTextDisplay(`Text: ${c.var.text}`),
      ]),
    )
  },
)

export const modal_modal = factory.modal(
  makeModal('modal', 'Modal Test', [
    makeActionRow([makeTextInput('modal_text', 'Modal Text').required(true)]),
    makeLabel('Channel Select', makeChannelSelect('channel')),
  ]),
  c => {
    const channelObj = c.ref.channels?.[c.var.channel?.[0] ?? '']
    return c.res(
      `- Text: ${c.var.modal_text}\n- Channel: ${channelObj?.name} <#${channelObj?.id}>`,
    )
  },
)
