import { makeSlashCommand, makeStringOption } from 'discord-hono'
import { factory } from '../init.js'

export const command_autocomplete = factory.autocomplete(
  makeSlashCommand('autocomplete', 'with autocomplete').options([
    makeStringOption('option', 'autocomplete option')
      .autocomplete(true)
      .required(true),
  ]),
  c => {
    // get choices for autocomplete
    // const db = c.env.DB
    // const option = c.var.option
    const choices = [
      { name: 'test1', value: 'v-test1' },
      { name: 'test2', value: 'v-test2' },
    ]
    // respond with choices
    return c.resAutocomplete(choices)
  },
  c => c.res(c.var.option),
)
