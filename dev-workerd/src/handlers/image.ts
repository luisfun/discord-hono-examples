import {
  makeMediaGallery,
  makeSection,
  makeSlashCommand,
  makeTextDisplay,
  makeThumbnail,
} from 'discord-hono'
import { factory } from '../init'

export const command_image = factory.command(
  makeSlashCommand('image', 'Response image file'),
  c =>
    c.flags('IS_COMPONENTS_V2').resDefer(async c => {
      const buff = await fetch('https://luis.fun/images/hono.webp').then(r =>
        r.arrayBuffer(),
      )
      return c.followup(
        {
          components: [
            makeSection(
              [makeTextDisplay('Discord Hono Image')],
              makeThumbnail('attachment://image.webp'),
            ),
            makeMediaGallery([
              'attachment://image.webp',
              'https://luis.fun/images/luisfun.webp',
            ]),
          ],
        },
        { blob: new Blob([buff]), name: 'image.webp' },
      )
    }),
)
