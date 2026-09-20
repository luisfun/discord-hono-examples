import { createFactory } from 'discord-hono'

export interface Env {
  Bindings: Cloudflare.Env & {
    // DISCORD_APPLICATION_ID: string
    // DISCORD_PUBLIC_KEY: string
    // DISCORD_TOKEN: string
  }
  // Variables: {}
}

export const factory = createFactory<Env>()
