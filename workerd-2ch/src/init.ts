import { createFactory } from 'discord-hono'

export type Env = {
  Bindings: {
    DB: D1Database
  }
}

export const factory = createFactory<Env>()
