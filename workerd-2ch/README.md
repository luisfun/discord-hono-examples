# /2ch（匿名投稿Bot）

[👉 招待URL](https://discord.com/oauth2/authorize?client_id=1370657822853042186&permissions=0&integration_type=0&scope=bot)

## 管理者向け

1. 招待URLからサーバーへ招待
2. `/admin`コマンドを管理者以外が触らないように設定  
  サーバー設定 > 連携サービス > `/admin`コマンドの設定
3. `/admin`コマンドから各設定をする

### クロスサーバー

この機能は、他のサーバーと投稿を共有する機能です。

他のサーバーに参加する手順：

1. 自分のサーバーIDをホストサーバーの人に教える
2. ホストサーバーの人が`クロス鯖へ招待`にそのIDを入力する

## For Developers

⚠️Check the version of discord-hono [👉package.json](https://github.com/luisfun/discord-hono-examples/blob/main/workerd-2ch/package.json)

[Getting Started](https://discord-hono.luis.fun/guides/start/)

### Services used

- Cloudflare Workers
- Cloudflare D1

### Initialization

The code to initialize via a Discord Bot command is included in [`init-db.ts`](https://github.com/luisfun/discord-hono-examples/blob/main/workerd-2ch/src/handlers/init-db.ts).  
To enable it, uncomment the relevant lines in [`index.ts`](https://github.com/luisfun/discord-hono-examples/blob/main/workerd-2ch/src/handlers/index.ts).

### Inspired by

https://qiita.com/peisuke/items/80984db8b47cd8243019
