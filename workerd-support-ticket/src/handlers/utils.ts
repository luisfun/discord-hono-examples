import {
  type $channels$_,
  type $guilds$_$channels,
  inspectResponse,
  permissionFlags,
  type RestData,
  type TypedResponse,
} from 'discord-hono'

export type CustomValues = [
  role: string | undefined,
  open: string | undefined,
  closed: string | undefined,
]

export type CreateChannelJson = RestData<'POST', typeof $guilds$_$channels>
export type ModifyChannelJson = RestData<'PATCH', typeof $channels$_>

export const restError = async (
  res: TypedResponse<unknown>,
  errorType: string,
) => {
  const debug = await inspectResponse(res)
  console.error(debug.text)
  return `### Error: Contact the developer\n${errorType}\n\`\`\`${debug.message}\`\`\``
}

export const channelPermission = (
  everyoneId: string,
  botId: string,
  userId?: string | null,
  role?: string,
) => {
  const permission: ModifyChannelJson['permission_overwrites'] = [
    {
      id: everyoneId,
      type: 0,
      deny: permissionFlags('VIEW_CHANNEL').toString(),
    },
    {
      id: botId,
      type: 1,
      allow: permissionFlags('VIEW_CHANNEL', 'SEND_MESSAGES').toString(),
    },
  ]
  if (userId)
    permission.push({
      id: userId,
      type: 1,
      allow: permissionFlags('VIEW_CHANNEL', 'SEND_MESSAGES').toString(),
    })
  if (role)
    permission.push({
      id: role,
      type: 0,
      allow: permissionFlags('VIEW_CHANNEL', 'SEND_MESSAGES').toString(),
    })
  return permission
}

export const toHashId = async (str: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)),
    ),
  )
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 4) // 4-digit hash ID
