import { Autocomplete, Button, Command, Components, Modal, Option, TextInput } from 'discord-hono'
import { factory } from '../init.js'
import { component_delete } from './utils.js'

export const command_100 = factory.autocomplete<{ text: string }>(
  new Command('100-discord-hono', 'Interaction Loop').options(
    new Option('text', 'Autocomplete Option').autocomplete().required(),
  ),
  c => {
    // console.log(c.focused?.name) // 'text'
    return c.resAutocomplete(
      new Autocomplete(c.focused?.value).choices(
        { name: 'test-1', value: 'value-1' },
        { name: 'test-2', value: 'value-2' },
      ),
    )
  },
  c =>
    c.res({
      content: `Input: ${c.var.text}`,
      components: new Components().row(component_100.component, component_delete.component),
    }),
)

export const component_100 = factory.component(new Button('100', 'Update'), c => c.resModal(modal_100.modal))

export const modal_100 = factory.modal(new Modal('100', 'Modal').row(new TextInput('update-text', 'Update Text')), c =>
  c.res({
    content: 'This is a modal',
    components: new Components().row(
      new Button('https://discord-hono.luis.fun', ['📑', 'Docs'], 'Link'),
      component_delete.component,
    ),
  }),
)
