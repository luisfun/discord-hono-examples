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
    // 適切なAPIが見つからなかった。可能な限り https://www.am.mufg.jp/tool/webapi/ などを利用する。
    const geomax: SustenFundJson = await fetch('https://static.susten.jp/funds/fund_realtime_data_geomax.json').then(
      r => r.json(),
    )

    // GeoMaxの基準価額と前日比
    const fund = geomax.funds.find(f => f.id === 111005)
    if (!fund) throw new Error('Fund not found')
    const navDiffRate = (fund.nav_diff / (fund.nav - fund.nav_diff)) * 100

    // 1日、1月、6月、3年の期間で計算
    let navGeomax = 10000
    let navSp500 = 10000
    const remapDaily = geomax.fund_vs_bm_daily.map(data => {
      navGeomax *= 1 + data[111005]
      navSp500 *= 1 + data.sp500_jpy_based
      return { navGeomax, navSp500 }
    })
    const dataset = (
      [
        { day: 1, label: '１日' },
        { day: 21, label: '１月' },
        { day: 130, label: '６月' },
        { day: 780, label: '３年' },
      ] as const
    ).map(({ day, label }) => {
      const navDaily = remapDaily.slice(-(day + 1)) // 差分を取るために+1

      // 騰落率計算
      const firstGeomax = navDaily[0].navGeomax
      const firstSp500 = navDaily[0].navSp500
      const changeRateGeomax = ((navGeomax - firstGeomax) / firstGeomax) * 100
      const changeRateSp500 = ((navSp500 - firstSp500) / firstSp500) * 100
      const changeRateDiff = changeRateGeomax - changeRateSp500

      // ドローダウン計算
      const maxGeomax = Math.max(...navDaily.map(r => r.navGeomax))
      const maxSp500 = Math.max(...navDaily.map(r => r.navSp500))
      const drawdownGeomax = ((navGeomax - maxGeomax) / maxGeomax) * 100
      const drawdownSp500 = ((navSp500 - maxSp500) / maxSp500) * 100
      const drawdownDiff = drawdownGeomax - drawdownSp500

      // 日数が足りない場合は打ち消し線を付与
      const fl = navDaily.length < day ? '~~' : ''
      // biome-ignore format: 三項演算子
      // 下落率強調ライン -6%、-20%、-30%、-60%
      const rate2star = day <= 1 ? drawdownGeomax < -6 : day <= 21 ? drawdownGeomax < -20 : day <= 130 ? drawdownGeomax < -30 : drawdownGeomax < -60
      const r2 = rate2star ? '**' : ''
      // biome-ignore format: 三項演算子
      // 差分強調ライン -3%、-10%、-15%、-30%
      const diff2star = day <= 1 ? drawdownDiff < -3 : day <= 21 ? drawdownDiff < -10 : day <= 130 ? drawdownDiff < -15 : drawdownDiff < -30
      const d2 = diff2star ? '**' : ''
      const alert = rate2star || diff2star
      return {
        day: Math.min(day, navDaily.length),
        changeText: `\n-# ${fl + label + fl} ： ${changeRateGeomax.toFixed(2)}% ｜ ${changeRateDiff.toFixed(2)}%`,
        drawdownText: `\n${alert ? '' : '-# '}${fl + label + fl} ： ${r2}${drawdownGeomax.toFixed(2)}%${r2} ｜ ${d2}${drawdownDiff.toFixed(2)}%${d2}`,
        alert,
      }
    })
    //if (!dataset.some(d => d.alert)) return

    const date = new Date(geomax.uploaded_time)
    if (date.getDate() !== new Date().getDate()) return

    return {
      flags: 1 << 2, // No embeds
      content: [
        `## GeoMax (${date.getMonth() + 1}/${date.getDate()})`,
        `-# 基準価額 ${fund.nav}円 前日比 ${navDiffRate.toFixed(2)}%`,
        `\n-# 期間 ： 騰落率 ｜ S&P500差分${dataset.map(m => m.changeText).join('')}`,
        `### 期間：ドローダウン｜S&P500差分${dataset.map(m => m.drawdownText).join('')}`,
        '### [比較チャート](https://www.wealthadvisor.co.jp/comparison?c1=2018070301&c2=2018013110&c3=2023090601)',
      ].join('\n'),
    }
  } catch (e: unknown) {
    console.error(e)
    return (e as Error)?.message || 'Error: getMessage'
  }
}
