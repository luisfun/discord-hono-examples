import {
  _guilds_$,
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
} from 'discord-hono'
import { createCrossLogTable } from '../db/create-cross-log-table.js'
import { deleteCrossLogTable } from '../db/delete-cross-log-table.js'
import { getCrossGuild } from '../db/get-cross-guild.js'
import { getCrossLog } from '../db/get-cross-log.js'
import { getGuild } from '../db/get-guild.js'
import { setGuild } from '../db/set-guild.js'
import { factory } from '../init.js'

type SwitchCustomId = 'up' | 'breakup' | 'exit'

const MAX_CROSS_GUILD = 10
const MAX_LOG_DISPLAY = 20

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
    // switch control
    if (!cross_guild_id) {
      component_switch_cross.component
        .label('クロス鯖を立てる')
        .custom_id('up' satisfies SwitchCustomId)
        .style('Primary')
    } else if (guild_id === cross_guild_id) {
      component_switch_cross.component
        .label('クロス鯖を解散')
        .custom_id('breakup' satisfies SwitchCustomId)
        .style('Danger')
    } else {
      component_switch_cross.component
        .label('クロス鯖から脱退')
        .custom_id('exit' satisfies SwitchCustomId)
        .style('Danger')
    }
    // invite control
    if (guild_id === cross_guild_id) component_invite_cross.component.disabled(false)
    else component_invite_cross.component.disabled() // なぜかオーバーライトが必要
  }
  if (cross.length >= MAX_CROSS_GUILD) {
    component_invite_cross.component.label('クロス鯖の上限').disabled()
  }

  // message json
  const embeds = [
    new Embed().title('管理ステータス').description(`
- 送信チャンネル：${sendChannel}
- クロスサーバー：${crossGuild + crossGuildList}
- サーバーID：\`${c.interaction.guild_id}\``),
  ]
  const components = new Components()
  if (cross_guild_id)
    components.row(
      component_log.component.label('ログを表示').emoji('📜').custom_id('').disabled(!guild?.cross_guild_id), // なぜかオーバーライトが必要
    )
  components.row(component_set_channel.component)
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
export const component_set_channel = factory.component(
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
  new Button('switch_cross', '').emoji('🔄'),
  c => {
    switch (c.var.custom_id) {
      case 'up':
        return c.update().resDefer(c =>
          followupTryCatch(c, async () => {
            if (!c.interaction.guild_id) throw new Error('Guild ID is undefined')
            const old = await getGuild(c.env.DB, c.interaction.guild_id)
            if (old?.cross_guild_id) throw new Error('Already cross guild')
            const guildData = await c.rest('GET', _guilds_$, [c.interaction.guild_id]).then(r => r.json())
            // cross guild creation
            await createCrossLogTable(c.env.DB, c.interaction.guild_id)
            await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, old?.channel_id, c.interaction.guild_id)
            // message update
            await c.followup(await getStatusMessage(c))
          }),
        )
      case 'breakup':
        return c.resModal(modal_breakup_cross.modal)
      case 'exit':
        return c.resModal(modal_exit_cross.modal)
      default:
        throw new Error('Invalid custom_id')
    }
  },
)
const BREAKUP_WORD = '解散する'
export const modal_breakup_cross = factory.modal(
  new Modal('breakup_cross', 'クロス鯖を解散').row(
    new TextInput('breakup_cross', `「${BREAKUP_WORD}」と入力`).placeholder(BREAKUP_WORD).required(),
  ),
  c =>
    c.update().resDefer(c =>
      followupTryCatch(c, async () => {
        const isBreakup = c.var.breakup_cross === BREAKUP_WORD
        // breakup
        if (isBreakup) {
          await deleteCrossLogTable(c.env.DB, c.interaction.guild_id)
          const cross = await getCrossGuild(c.env.DB, c.interaction.guild_id)
          await Promise.all(cross.map(g => setGuild(c.env.DB, g.guild_id, g.guild_name, g.channel_id, undefined)))
        }
        // message item
        const { embeds, components } = await getStatusMessage(c)
        if (!isBreakup) embeds[0].fields({ name: '⚠️解散していません', value: '入力が間違っています' })
        // update message
        await c.followup({ embeds, components })
      }),
    ),
)
const EXIT_WORD = '脱退する'
export const modal_exit_cross = factory.modal(
  new Modal('exit_cross', 'クロス鯖から脱退').row(
    new TextInput('exit_cross', `「${EXIT_WORD}」と入力`).placeholder(EXIT_WORD).required(),
  ),
  c =>
    c.update().resDefer(c =>
      followupTryCatch(c, async () => {
        if (!c.interaction.guild_id) throw new Error('guild_id is undefined')
        const isExit = c.var.exit_cross === EXIT_WORD
        // exit
        if (isExit) {
          const old = await getGuild(c.env.DB, c.interaction.guild_id)
          const guildData = await c.rest('GET', _guilds_$, [c.interaction.guild_id]).then(r => r.json())
          await setGuild(c.env.DB, c.interaction.guild_id, guildData.name, old?.channel_id, undefined)
        }
        // message item
        const { embeds, components } = await getStatusMessage(c)
        if (!isExit) embeds[0].fields({ name: '⚠️脱退していません', value: '入力が間違っています' })
        // update message
        await c.followup({ embeds, components })
      }),
    ),
)

// クロス鯖への招待
export const component_invite_cross = factory.component(
  new Button('invite_cross', ['➡️', 'クロス鯖へ招待']).disabled(),
  c => c.resModal(modal_invite_cross.modal),
)
export const modal_invite_cross = factory.modal(
  new Modal('invite_cross', 'クロス鯖へ招待').row(
    new TextInput('invite_cross', '追加するサーバーIDを入力').placeholder('123456789123456789').required(),
  ),
  c =>
    c.update().resDefer(c =>
      followupTryCatch(c, async () => {
        const inviteGuild = await getGuild(c.env.DB, c.var.invite_cross)
        if (inviteGuild && !inviteGuild.cross_guild_id && c.interaction.guild_id) {
          // invite
          await setGuild(
            c.env.DB,
            inviteGuild.guild_id,
            inviteGuild.guild_name,
            inviteGuild.channel_id,
            c.interaction.guild_id,
          )
        }
        // message item
        // biome-ignore format: ternary operator
        const failedMessage =
          !inviteGuild ? '対象のサーバーが見つかりません' :
          inviteGuild.cross_guild_id ? 'いずれかのクロス鯖へ参加しています' :
          !c.interaction.guild_id ? '不明' : ''
        const { embeds, components } = await getStatusMessage(c)
        if (failedMessage) embeds[0].fields({ name: '⚠️招待エラー', value: failedMessage })
        else embeds[0].fields({ name: '✅招待成功', value: 'クロスサーバーに追加されました' }) // できたら無くてもいいようにしたい
        // update message
        await c.followup({ embeds, components })
      }),
    ),
)

const getMessageLogs = async (c: CommandContext | ComponentContext | ModalContext, page: number) => {
  // get database data
  const guild = await getGuild(c.env.DB, c.interaction.guild_id)
  const cross = await getCrossGuild(c.env.DB, guild?.cross_guild_id)
  const log = await getCrossLog(c.env.DB, guild?.cross_guild_id, MAX_LOG_DISPLAY * (page - 1), MAX_LOG_DISPLAY)

  const guildName = (guild_id: string | undefined) => cross.find(e => e.guild_id === guild_id)?.guild_name ?? 'Unknown'
  const maxPage = log.length / MAX_LOG_DISPLAY
  console.log(page, log)

  // message json
  const embeds = [
    new Embed()
      .title('ログ')
      .description(log.map(e => `${e.id}：<@${e.user_id}>：${guildName(e.guild_id)}`).join('\n')),
  ]
  const components = new Components().row(component_main.component).row(
    component_log.component
      .label('前のログ')
      .emoji('⬅️')
      .custom_id(String(page - 1))
      .disabled(page <= 1)
      .toJSON(),
    component_log.component
      .label('次のログ')
      .emoji('➡️')
      .custom_id(String(page + 1))
      .disabled(maxPage <= page)
      .toJSON(),
  )
  return { embeds, components }
}

// ログ表示＋ページ送り
export const component_log = factory.component(new Button('log', ['📜', 'ログを表示']), c =>
  c.update().resDefer(c =>
    followupTryCatch(c, async () => {
      await c.followup(await getMessageLogs(c, Number(c.var.custom_id || 1)))
    }),
  ),
)

// 管理へ戻る
export const component_main = factory.component(new Button('main', ['🏠', '管理へ戻る']), c =>
  c.update().resDefer(c =>
    followupTryCatch(c, async () => {
      await c.followup(await getStatusMessage(c))
    }),
  ),
)
