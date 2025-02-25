import { createFactory } from 'discord-hono'

export type Env = {
  Bindings: {
    DB: unknown
  }
}

export const factory = createFactory<Env>()
