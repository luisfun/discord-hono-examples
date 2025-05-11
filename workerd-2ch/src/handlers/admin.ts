import {
  Button,
  Command,
  type CommandContext,
  type ComponentContext,
  Components,
  Modal,
  type ModalContext,
  Select,
  TextInput,
  _guilds_$,
} from 'discord-hono'
import { createCrossLogTable } from '../db/create-cross-log-table.js'
import type { GuildTableColumns } from '../db/create-guild-table.js'
import { deleteCrossLogTable } from '../db/delete-cross-log-table.js'
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

type SwitchCustomId = 'up' | 'breakup' | 'exit'

const getComponents = (guild: GuildTableColumns | null) => {
  if (!guild) throw new Error('Guild is undefined')
  const { channel_id, guild_id, cross_guild_id } = guild

  if (channel_id) component_set_channel.component.default_values({ id: channel_id, type: 'channel' })

  component_switch_cross.component.custom_id(
    (!cross_guild_id ? 'up' : guild_id === cross_guild_id ? 'breakup' : 'exit') satisfies SwitchCustomId,
  )
  component_switch_cross.component.label(
    !cross_guild_id ? 'クロス鯖を立てる' : guild_id === cross_guild_id ? 'クロス鯖を解散' : 'クロス鯖から脱退',
  )
  // component_switch_cross.component.style(!cross_guild_id ? "Primary" : "Danger")

  return new Components().row(component_set_channel.component).row(component_switch_cross.component)
}

const displayStatus = async (c: CommandContext | ComponentContext | ModalContext, preprocess?: () => Promise<void>) => {
  try {
    if (preprocess) await preprocess()
    const { content, guild } = await getStatus(c.env.DB, c.interaction.guild_id)
    const components = getComponents(guild)
    await c.followup({ content, components })
    // biome-ignore lint: any
  } catch (e: any) {
    console.error(e)
    await c.followup(`Error: ${e.message}`)
  }
}

// 最初の表示
export const command_admin = factory.command(new Command('admin', '管理者用'), c => c.resDefer(c => displayStatus(c)))

// チャンネル選択後の表示
export const component_set_channel = factory.component<{ set_channel: [string] }, Select<'Channel'>>(
  new Select('set_channel', 'Channel').placeholder('送信チャンネルを選択'),
  c =>
    c.update().resDefer(c =>
      displayStatus(c, async () => {
        if (!c.interaction.guild_id) throw new Error('Guild ID is undefined')
        const old = await getGuild(c.env.DB, c.interaction.guild_id)
        const guildData = await c.rest('GET', _guilds_$, [c.interaction.guild_id]).then(r => r.json())
        await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, c.var.set_channel[0], old?.cross_guild_id)
      }),
    ),
)

// クロス鯖スイッチ後の表示
export const component_switch_cross = factory.component<{ custom_id: SwitchCustomId }, Button>(
  new Button('switch_cross', ['🔄️', '']),
  c =>
    c.update().resDefer(c =>
      displayStatus(c, async () => {
        if (!c.interaction.guild_id) throw new Error('Guild ID is undefined')
        const old = await getGuild(c.env.DB, c.interaction.guild_id)
        const guildData = await c.rest('GET', _guilds_$, [c.interaction.guild_id]).then(r => r.json())
        switch (c.var.custom_id) {
          case 'up':
            await createCrossLogTable(c.env.DB, c.interaction.guild_id)
            await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, old?.channel_id, c.interaction.guild_id)
            break
          case 'breakup':
            await deleteCrossLogTable(c.env.DB, c.interaction.guild_id)
            await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, old?.channel_id, undefined)
            break
          case 'exit':
            await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, old?.channel_id, undefined)
            break
          default:
            throw new Error('Invalid custom_id')
        }
      }),
    ),
)

// クロス鯖への招待
export const component_invite_cross = factory.component(new Button('invite_cross', ['📲', 'クロス鯖へ追加']), c =>
  c.resModal(modal_invite_cross.modal),
)
export const modal_invite_cross = factory.modal<{ invite_cross: string }>(
  new Modal('invite_cross', 'クロス鯖へ追加').row(
    new TextInput('invite_cross', '追加するサーバーIDを入力').placeholder('123456789123456789').required(),
  ),
  c =>
    c.resDefer(c =>
      displayStatus(c, async () => {
        console.log(c.var.invite_cross)
      }),
    ),
)
