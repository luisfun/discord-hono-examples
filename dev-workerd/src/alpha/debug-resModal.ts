import {
  inspectResponse,
  makeLabel,
  makeSlashCommand,
  makeTextInput,
} from 'discord-hono'

import { factory } from '../init.js'

export const command_debug_resModal = factory.command(
  makeSlashCommand('debug-resmodal', 'Debug Modal'),
  c => {
    return c.resModal(modal_debug_resModal.modal, async res => {
      const debug = await inspectResponse(res)
      console.log(debug.text)
    })
  },
)

export const modal_debug_resModal = factory.modal(
  {
    title: 'Debug Modal',
    custom_id: 'e'.repeat(101),
    components: [makeLabel('Label', makeTextInput('input', 'Input')).toJSON()],
  },
  c => c.res('debug'),
)
