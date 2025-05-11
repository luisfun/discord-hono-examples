import { Button, Command, Components, Select, _guilds_$ } from 'discord-hono'
import { getCrossGuild } from '../db/get-cross-guild.js'
import { getGuild } from '../db/get-guild.js'
import { setGuild } from '../db/set-guild.js'
import { factory } from '../init.js'

const getStatus = async (db: D1Database, guild_id: string | undefined) => {
  const guild = await getGuild(db, guild_id)
  const cross = await getCrossGuild(db, guild?.cross_guild_id)

  const sendChannel = guild?.channel_id ? `<#${guild?.channel_id}>` : '未設定'
  // biome-ignore format: ternary operator
  const crossGuild =
    !guild?.cross_guild_id ? '未設定' :
    guild?.cross_guild_id === guild.guild_id ? 'ホスト' :
    `${cross.find(e => e.guild_name === guild.cross_guild_id)?.guild_name} がホスト`
  const crossGuildList = !guild?.cross_guild_id ? '' : `\n${cross.map(e => `  - ${e.guild_name}`).join('\n')}`

  return {
    guild,
    cross,
    content: `### ステータス\n- 送信チャンネル: ${sendChannel}\n- クロスサーバー: ${crossGuild + crossGuildList}`,
  }
}

const getComponents = (id: string | undefined) => {
  if (id) components_set_channel.component.default_values({ id, type: 'channel' })
  return new Components().row(components_set_channel.component)
}

export const command_admin = factory.command(new Command('admin', '管理者用'), c =>
  c.resDefer(async c => {
    try {
      const { content, guild } = await getStatus(c.env.DB, c.interaction.guild_id)
      const components = getComponents(guild?.channel_id)
      await c.followup({ content, components })
      // biome-ignore lint: any
    } catch (e: any) {
      console.error(e)
      await c.followup(`Error: ${e.message}`)
    }
  }),
)

export const components_set_channel = factory.component<{ set_channel: string }, Select<'Channel'>>(
  new Select('set_channel', 'Channel'),
  c =>
    c.update().resDefer(async c => {
      try {
        if (!c.interaction.guild_id) throw new Error('Guild ID is undefined')
        const old = await getGuild(c.env.DB, c.interaction.guild_id)
        const guildData = await c.rest('GET', _guilds_$, [c.interaction.guild_id]).then(r => r.json())
        console.log(c.interaction.data, '\n\n', c.var)
        //await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, c.var.set_channel, old?.cross_guild_id)

        const { content, guild } = await getStatus(c.env.DB, c.interaction.guild_id)
        const components = getComponents(guild?.channel_id)
        await c.followup({ content, components })
        // biome-ignore lint: any
      } catch (e: any) {
        console.error(e)
        await c.followup(`Error: ${e.message}`)
      }
    }),
)
