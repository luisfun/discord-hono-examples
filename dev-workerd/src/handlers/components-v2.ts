import {
  makeActionRow,
  makeContainer,
  makeLinkButton,
  makeMediaGallery,
  makeMediaGalleryItem,
  makeSection,
  makeSeparator,
  makeSlashCommand,
  makeTextDisplay,
  makeThumbnail,
  makeUnfurledMediaItem,
} from 'discord-hono'
import { factory } from '../init.js'

export const command_components_v2 = factory.command(
  makeSlashCommand('components_v2', 'Response components_v2'),
  async c =>
    c.flags('IS_COMPONENTS_V2').resDefer(async () => {
      const buff = await fetch('https://luis.fun/images/hono.webp').then(r =>
        r.arrayBuffer(),
      )
      await c.followup(
        {
          components: [
            makeTextDisplay('text top'),
            makeContainer([
              makeActionRow([
                makeLinkButton('https://discord-hono.luis.fun', ['📑', 'Docs']),
              ]),
              makeSeparator(),
              makeTextDisplay('container - text'),
              makeSection(
                [
                  makeTextDisplay('container - section - text'),
                  makeTextDisplay('container - section - text2'),
                ],
                makeThumbnail('attachment://image.webp'),
              ),
              makeTextDisplay('container - text2'),
              makeMediaGallery([]).items([
                makeMediaGalleryItem(
                  makeUnfurledMediaItem('attachment://image.webp')
                    .width(100)
                    .height(100),
                ).spoiler(true),
                {
                  media: {
                    url: 'https://luis.fun/images/luisfun.webp',
                  },
                },
              ]),
            ]),
          ],
        },
        { blob: new Blob([buff]), name: 'image.webp' },
      )
    }),
)
