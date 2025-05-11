import {
  Button,
  Command,
  type CommandContext,
  type ComponentContext,
  Components,
  Embed,
  Modal,
  type ModalContext,
  Select,
  TextInput,
  _channels_$_messages_$,
  _guilds_$,
} from 'discord-hono'
import { createCrossLogTable } from '../db/create-cross-log-table.js'
import { deleteCrossLogTable } from '../db/delete-cross-log-table.js'
import { getCrossGuild } from '../db/get-cross-guild.js'
import { getGuild } from '../db/get-guild.js'
import { setGuild } from '../db/set-guild.js'
import { factory } from '../init.js'

type SwitchCustomId = 'up' | 'breakup' | 'exit'

const MAX_CROSS_GUILD = 10

const getStatusMessage = async (c: CommandContext | ComponentContext | ModalContext) => {
  // get database data
  const guild = await getGuild(c.env.DB, c.interaction.guild_id)
  const cross = await getCrossGuild(c.env.DB, guild?.cross_guild_id)

  // message item
  const sendChannel = guild?.channel_id ? `<#${guild?.channel_id}>` : '未設定'
  // biome-ignore format: ternary operator
  const crossGuild =
      !guild?.cross_guild_id ? '未設定' :
      guild?.cross_guild_id === guild.guild_id ? 'ホスト' :
      `${cross.find(e => e.guild_name === guild.cross_guild_id)?.guild_name} がホスト`
  const crossGuildList = !guild?.cross_guild_id ? '' : `\n${cross.map(e => `  - ${e.guild_name}`).join('\n')}`

  // component restyle
  const { channel_id, guild_id, cross_guild_id } = guild ?? {}
  if (channel_id) component_set_channel.component.default_values({ id: channel_id, type: 'channel' })
  if (guild_id) {
    component_switch_cross.component.custom_id(
      (!cross_guild_id ? 'up' : guild_id === cross_guild_id ? 'breakup' : 'exit') satisfies SwitchCustomId,
    )
    component_switch_cross.component.label(
      !cross_guild_id ? 'クロス鯖を立てる' : guild_id === cross_guild_id ? 'クロス鯖を解散' : 'クロス鯖から脱退',
    )
    component_switch_cross.component.style(!cross_guild_id ? 'Primary' : 'Danger') // discord-hono v0.19.2
    if (guild_id !== cross_guild_id) component_invite_cross.component.disabled()
  }
  if (cross.length >= MAX_CROSS_GUILD) {
    component_invite_cross.component.label('クロス鯖の上限')
    component_invite_cross.component.disabled()
  }

  // message json
  const embeds = [
    new Embed().title('管理ステータス').description(`
- 送信チャンネル：${sendChannel}
- クロスサーバー：${crossGuild + crossGuildList}
- サーバーID：\`${c.interaction.guild_id}\``),
  ]
  const components = new Components().row(component_set_channel.component)
  if (guild_id) components.row(component_switch_cross.component, component_invite_cross.component)

  return { embeds, components }
}

const followupTryCatch = async (
  c: CommandContext | ComponentContext | ModalContext,
  tryProcess: () => Promise<void>,
) => {
  try {
    await tryProcess()
    // biome-ignore lint: any
  } catch (e: any) {
    console.error(e)
    await c.followup(`Error: ${e.message}`)
  }
}

// 最初の表示
export const command_admin = factory.command(new Command('admin', '管理者用'), c =>
  c.resDefer(c =>
    followupTryCatch(c, async () => {
      await c.followup(await getStatusMessage(c))
    }),
  ),
)

// チャンネル選択後の表示
export const component_set_channel = factory.component<{ set_channel: [string] }, Select<'Channel'>>(
  new Select('set_channel', 'Channel').placeholder('送信チャンネルを選択'),
  c =>
    c.update().resDefer(c =>
      followupTryCatch(c, async () => {
        if (!c.interaction.guild_id) throw new Error('Guild ID is undefined')
        const old = await getGuild(c.env.DB, c.interaction.guild_id)
        const guildData = await c.rest('GET', _guilds_$, [c.interaction.guild_id]).then(r => r.json())
        await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, c.var.set_channel[0], old?.cross_guild_id)
        await c.followup(await getStatusMessage(c))
      }),
    ),
)

// クロス鯖スイッチ後の表示
export const component_switch_cross = factory.component<{ custom_id: SwitchCustomId }, Button>(
  new Button('switch_cross', ['🔄', '']),
  c =>
    c.update().resDefer(c =>
      followupTryCatch(c, async () => {
        if (!c.interaction.guild_id) throw new Error('Guild ID is undefined')
        const old = await getGuild(c.env.DB, c.interaction.guild_id)
        const guildData = await c.rest('GET', _guilds_$, [c.interaction.guild_id]).then(r => r.json())
        switch (c.var.custom_id) {
          case 'up':
            if (old?.cross_guild_id) throw new Error('Already cross guild')
            await createCrossLogTable(c.env.DB, c.interaction.guild_id)
            await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, old?.channel_id, c.interaction.guild_id)
            break
          case 'breakup': {
            await deleteCrossLogTable(c.env.DB, c.interaction.guild_id)
            const cross = await getCrossGuild(c.env.DB, c.interaction.guild_id)
            await Promise.all(cross.map(g => setGuild(c.env.DB, g.guild_id, g.guild_name, g.channel_id, undefined)))
            break
          }
          case 'exit':
            await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, old?.channel_id, undefined)
            break
          default:
            throw new Error('Invalid custom_id')
        }
        await c.followup(await getStatusMessage(c))
      }),
    ),
)

// クロス鯖への招待
export const component_invite_cross = factory.component(new Button('invite_cross', ['➡️', 'クロス鯖へ招待']), c =>
  c.resModal(modal_invite_cross.modal),
)
export const modal_invite_cross = factory.modal<{ invite_cross: string }>(
  new Modal('invite_cross', 'クロス鯖へ招待').row(
    new TextInput('invite_cross', '追加するサーバーIDを入力').placeholder('123456789123456789').required(),
  ),
  c =>
    c.flags('EPHEMERAL').resDefer(c =>
      followupTryCatch(c, async () => {
        if (!c.interaction.channel || !c.interaction.message) throw new Error('channel or message is undefined')
        const inviteGuild = await getGuild(c.env.DB, c.var.invite_cross)
        if (inviteGuild && !inviteGuild.cross_guild_id && c.interaction.guild_id)
          await setGuild(
            c.env.DB,
            inviteGuild.guild_id,
            inviteGuild.guild_name,
            inviteGuild.channel_id,
            c.interaction.guild_id,
          )

        // message item
        // biome-ignore format: ternary operator
        const failedMessage =
          !inviteGuild ? '対象のサーバーが見つかりません' :
          inviteGuild.cross_guild_id ? 'いずれかのクロス鯖へ参加しています' :
          !c.interaction.guild_id ? '不明' : ''
        const { embeds, components } = await getStatusMessage(c)
        if (failedMessage) embeds[0].fields({ name: '⚠️招待エラー', value: failedMessage })

        // modalはupdateできないため、restでメッセージを更新する
        await c.rest('PATCH', _channels_$_messages_$, [c.interaction.channel.id, c.interaction.message.id], {
          embeds,
          components,
        })
        await c.followup()
      }),
    ),
)
