## 開発で利用している、参考用コード集

```
project/
├── src/
│   ├── alpha/      // リリース前機能の動作確認
│   │   └── ...
│   ├── handlers/   // リリース済み機能の動作確認
│   │   └── ...
│   └── ...
...
```

## 開発セットアップ

- [discord-hono](https://github.com/luisfun/discord-hono)
- [discord-hono-examples](https://github.com/luisfun/discord-hono-examples)

2つのリポジトリをフォーク&クローンし、開発環境を構築

### discord-hono を準備

discord-hono をフォーク&クローン後、次のコマンドでローカル開発用のパッケージ環境を構築

```sh
npm ci
npm run build
npm link
```

### package インストール

examples へ戻り次のコマンドでpackageをインストール

```sh
cd dev-workerd
npm ci
npm link discord-hono
```

[Docs](https://discord-hono.luis.fun/guides/start/) を参考に、開発用Botを作成
