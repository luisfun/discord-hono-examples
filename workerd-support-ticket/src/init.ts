import { createFactory } from 'discord-hono'

export const factory = createFactory<{
  Bindings: Env & { DISCORD_APPLICATION_ID: string }
}>()
