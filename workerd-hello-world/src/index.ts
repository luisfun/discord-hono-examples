import { DiscordHono, makeActionRow, makeButton, makeLinkButton } from 'discord-hono'

const app = new DiscordHono()
  .command('hello', c => c.res(`Hello, ${c.var.name ?? 'World'}!`))
  .command('help', c =>
    c.res({
      components: [
        makeActionRow([
          makeLinkButton('https://discord-hono.luis.fun', ['📑', 'Docs']),
          makeButton('delete', ['🗑️', 'Delete']),
        ]),
      ],
    }),
  )
  .component('delete', c => c.update().resDefer(c => c.followup()))

export default app

// Example to check next
// https://github.com/luisfun/discord-hono-examples/tree/main/workerd-use-factory
