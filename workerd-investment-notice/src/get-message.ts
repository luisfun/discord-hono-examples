import type { $webhooks$_$_, RestData } from 'discord-hono'

type WebhookData = RestData<'POST', typeof $webhooks$_$_>

type SustenFundJson = {
  uploaded_time: string
  funds: {
    id: number
    total_net_assets: number
    nav: number
    nav_diff: number
  }[]
  time_series: {
    Date: string
    Price: number
    AUM: number
  }[]
  fund_vs_bm_daily: {
    '111005': number
    Date: string
    sp500_jpy_based: number
  }[]
}

export const getMessage = async (): Promise<WebhookData | undefined> => {
  try {
    // 倫理的に悪い取得の可能性がある。可能な限り https://www.am.mufg.jp/tool/webapi/ を利用する。
    const geomax: SustenFundJson = await fetch('https://static.susten.jp/funds/fund_realtime_data_geomax.json').then(
      r => r.json(),
    )

    // GeoMaxの基準価額と前日比
    const fund = geomax.funds.find(f => f.id === 111005)
    if (!fund) throw new Error('Fund not found')
    const navDiffRate = (fund.nav_diff / (fund.nav - fund.nav_diff)) * 100
    const navText = `-# 基準価額 ${fund.nav}円 前日比 ${navDiffRate.toFixed(2)}%`

    // 1日、1月、6月、3年の期間最大下落率を計算
    let navGeomax = 10000
    let navSp500 = 10000
    const remapDaily = geomax.fund_vs_bm_daily.map(data => {
      navGeomax *= 1 + data[111005]
      navSp500 *= 1 + data.sp500_jpy_based
      return { navGeomax, navSp500 }
    })
    const drawdowns = (
      [
        { day: 1, label: '１日' },
        { day: 22, label: '１月' },
        { day: 130, label: '６月' },
        { day: 780, label: '３年' },
      ] as const
    ).map(({ day, label }) => {
      const navDaily = remapDaily.slice(-day)
      const maxGeomax = Math.max(...navDaily.map(r => r.navGeomax))
      const maxSp500 = Math.max(...navDaily.map(r => r.navSp500))
      const drawdownGeomax = ((navGeomax - maxGeomax) / maxGeomax) * 100
      const drawdownSp500 = ((navSp500 - maxSp500) / maxSp500) * 100
      const drawdownDiff = drawdownGeomax - drawdownSp500
      // biome-ignore format: 三項演算子
      // 下落率強調ライン -5%、-20%、-30%、-60%
      const rate2star = day <= 1 ? drawdownGeomax < -5 : day <= 22 ? drawdownGeomax < -20 : day <= 130 ? drawdownGeomax < -30 : drawdownGeomax < -60
      const r2 = rate2star ? '**' : ''
      // biome-ignore format: 三項演算子
      // 差分強調ライン -3%、-10%、-15%、-30%
      const diff2star = day <= 1 ? drawdownDiff < -3 : day <= 22 ? drawdownDiff < -10 : day <= 130 ? drawdownDiff < -15 : drawdownDiff < -30
      const d2 = diff2star ? '**' : ''
      const alert = rate2star || diff2star
      return {
        day: navDaily.length,
        text: `\n${alert ? '' : '-# '}${label} ： ${r2}${drawdownGeomax.toFixed(2)}%${r2} ｜ ${d2}${drawdownDiff.toFixed(2)}%${d2}`,
        alert,
      }
    })
    //if (!drawdowns.some(d => d.alert)) return
    return {
      flags: 1 << 2, // No embeds
      content: `## GeoMax\n${navText}\n### 期間最大下落率、S&P500差分${drawdowns.map(m => m.text).join('')}\n### [比較チャート](https://www.wealthadvisor.co.jp/comparison?c1=2018070301&c2=2018013110&c3=2023090601)`,
    }
  } catch (e: unknown) {
    console.error(e)
    return (e as Error)?.message || 'Error: getMessage'
  }
}
