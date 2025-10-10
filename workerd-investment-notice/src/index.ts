import { webhook } from 'discord-hono'
import { getMessage } from './get-message'

type AppEnv = Env & {
  DISCORD_WEBHOOK_URL: string
}

export default {
  async fetch(req) {
    const url = new URL(req.url)
    url.pathname = '/__scheduled'
    return new Response(
      `To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`,
    )
  },
  async scheduled(_event, env, _ctx): Promise<void> {
    const message = await getMessage()
    if (!message) return
    await webhook(env.DISCORD_WEBHOOK_URL, message)
  },
} satisfies ExportedHandler<AppEnv>
