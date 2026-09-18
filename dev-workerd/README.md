## Reference Code Used During Development

```
project/
├── src/
│   ├── alpha/      // Testing features before release
│   │   └── ...
│   ├── handlers/   // Testing released features
│   │   └── ...
│   └── ...
...
```

## Development Setup

- [discord-hono](https://github.com/luisfun/discord-hono)
- [discord-hono-examples](https://github.com/luisfun/discord-hono-examples)

Fork and clone both repositories to set up the development environment.

### Prepare discord-hono

After forking and cloning `discord-hono`, run the following commands to set up the package for local development.

```sh
npm ci
npm run build
npm link
```

### Install the Package

Return to the examples repository and install the package with the following commands.

```sh
cd dev-workerd
npm ci
npm link discord-hono
```

Create a development bot by following the [documentation](https://discord-hono.luis.fun/guides/start/).
