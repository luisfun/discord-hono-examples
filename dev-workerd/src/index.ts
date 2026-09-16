import * as alpha from './alpha'
import { factory } from './init'
import * as handlers from './public'

export default factory
  .discord()
  .loader(Object.values({ ...alpha, ...handlers }))
