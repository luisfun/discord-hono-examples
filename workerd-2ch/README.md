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

## 開発者向け

使ってるサービス

- Cloudflare Workers
- Cloudflare D1

ライブラリ

- [discord-hono](https://discord-hono.luis.fun/ja/)

初期化について

[`init-db.ts`](https://github.com/luisfun/discord-hono-examples/blob/main/workerd-2ch/src/handlers/init-db.ts)にDiscord Botのコマンドで初期化するコードが含まれています。  
[`index.ts`](https://github.com/luisfun/discord-hono-examples/blob/main/workerd-2ch/src/handlers/index.ts)のコメントアウトを解除して有効化してください。

### インスパイア元

https://qiita.com/peisuke/items/80984db8b47cd8243019
