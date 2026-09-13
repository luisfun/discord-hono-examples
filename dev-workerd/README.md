
memo

tsconfig.jsonに変更なし
代わりにtsxインストール

理由：node用のimport文が不要。tsconfigの変更不要。tsxのベースにあるesbuildがすでに入ってる。

## 開発セットアップ

### discord-hono を準備

discord-hono をフォーク&クローンし、次のコマンドでローカル開発用のパッケージ環境を構築

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
