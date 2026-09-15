import {
  makePoll,
  makePollAnswer,
  makePollMedia,
  makeSubCommand,
} from 'discord-hono'
import { factory } from '../../init.js'

export const sub_public_poll = factory.subCommand(
  makeSubCommand('poll', 'color poll!'),
  c =>
    c.res({
      poll: makePoll('What is your favorite color?', [
        ['🔴', 'Red'],
        ['🟢', 'Green'],
        'Blue',
        'Yellow',
        ['🟣', 'Purple'],
        'Black',
      ])
        .allow_multiselect(true)
        .duration(1),
    }),
)

export const sub_public_poll2 = factory.subCommand(
  makeSubCommand('poll2', 'fruit poll!'),
  c => {
    const answer = makePollAnswer(makePollMedia(['🍌', 'Banana']))
    // Try hovering over `poll`
    const poll = makePoll('', [])
      .question(makePollMedia('question'))
      .answers([
        answer
          .clone()
          .poll_media({
            text: 'Apple',
            emoji: { id: null, name: '🍎' },
          } as const),
        answer,
        answer.clone().poll_media({ text: 'Cherry' as const }),
        makePollAnswer(
          makePollMedia('Orange').emoji({ id: null, name: '🍊' } as const),
        ),
        {
          poll_media: {
            text: 'Pineapple',
            emoji: { id: null, name: '🍍' },
          } as const,
        },
      ])
      .question({ text: 'What is your favorite fruit?' } as const)
      .duration(1)
    return c.res({ poll })
  },
)
