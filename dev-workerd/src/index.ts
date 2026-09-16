import * as alpha from './alpha'
import * as handlers from './handlers'
import { factory } from './init'

export default factory
  .discord()
  .loader(Object.values({ ...alpha, ...handlers }))
