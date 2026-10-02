import type { Locale } from 'discord-api-types/v10'

type SupportedLocale = Locale.EnglishUS | Locale.Japanese

export const loc = {
  cmd: {
    description: {
      'en-US': 'Setup a new ticket system',
      ja: '新しいチケットシステムを設定',
    },
    optionChannel: {
      'en-US': 'Channel to post ticket information',
      ja: 'チケット情報を投稿するチャンネル',
    },
    optionRole: {
      'en-US': 'Support Team Role',
      ja: 'サポートチームのロール',
    },
    optionOpen: {
      'en-US': 'Open Tickets Category',
      ja: 'オープンチケットのカテゴリ',
    },
    optionClosed: {
      'en-US': 'Closed Tickets Category',
      ja: 'クローズドチケットのカテゴリ',
    },
  },
  open: {
    message: {
      'en-US': '## Support\nPress the button to create a support channel.',
      ja: '## お問い合わせ\nボタンを押すと、お問い合わせチャンネルが作成されます。',
    },
    button: {
      'en-US': 'Create Ticket',
      ja: 'お問い合わせを作成',
    },
    response: {
      'en-US': 'Created a support channel. Please check it.',
      ja: 'お問い合わせチャンネルを作成しました。確認してください。',
    },
    error: {
      'en-US':
        'Admin Notice\nOpen tickets category not found. Please reconfigure the ticket system.',
      ja: '管理者へ\nオープンチケットのカテゴリが見つかりません。チケットシステムを再設定してください。',
    },
  },
  close: {
    message: {
      'en-US':
        '## Support Channel\nPress the button to close this support channel.',
      ja: '## お問い合わせチャンネル\nボタンを押すと、このお問い合わせを閉じます。',
    },
    button: {
      'en-US': 'Close Ticket',
      ja: 'お問い合わせを閉じる',
    },
    finished: {
      'en-US': 'This support has been closed.',
      ja: 'このお問い合わせは閉じられました。',
    },
    error: {
      'en-US':
        'Closed tickets category or support team role not found. Fallback action was taken.',
      ja: 'クローズカテゴリまたはサポートチームのロールが見つからなかったため、フォールバック動作を行いました。',
    },
  },
} as const satisfies Record<
  string,
  Record<string, Record<SupportedLocale, string>>
>

export const normalizeLocale = (locale: Locale) => {
  if (Object.keys(loc.cmd.description).includes(locale))
    return locale as SupportedLocale
  return 'en-US'
}
