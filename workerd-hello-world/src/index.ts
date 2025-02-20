import { Button, Components, DiscordHono } from 'discord-hono'

type AppEnv = {
  Bindings: Env
  Variables: {
    name?: string
  }
}

const app = new DiscordHono<AppEnv>()
  .command('hello', c => c.res(`Hello, ${c.var.name ?? 'World'}!`))
  .command('help', c =>
    c.res({
      components: new Components().row(
        new Button('https://discord-hono.luis.fun', ['📑', 'Docs'], 'Link'),
        new Button('delete', ['🗑️', 'Delete']),
      ),
    }),
  )
  .component('delete', c => c.resDeferUpdate(c.followupDelete))

export default app
