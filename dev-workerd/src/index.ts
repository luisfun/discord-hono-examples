import * as alpha from './alpha'
import * as handlers from './handlers'
import { factory } from './init'
//import { GatewayDO } from 'discord-hono'

export default factory
  .discord()
  .loader(Object.values({ ...alpha, ...handlers }))
