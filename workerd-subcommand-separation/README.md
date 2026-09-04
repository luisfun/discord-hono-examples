## Subcommand separation example

⚠️Check the version of discord-hono [👉package.json](https://github.com/luisfun/discord-hono-examples/blob/main/workerd-subcommand-separation/package.json)

[Getting Started](https://discord-hono.luis.fun/guides/start/)

```
project/
├── src/
│   ├── handlers/
│   │   ├── get               // sub command base
│   │   │   ├── channel       // sub command group
│   │   │   │   ├── index.ts  // sub command group aggregation
│   │   │   │   └── meta.ts   // sub command in group
│   │   │   ├── help.ts       // sub command
│   │   │   └── index.ts      // sub command aggregation
│   │   ├── hello.ts          // command
│   │   ├── help.ts           // command
│   │   ├── index.ts          // handler aggregation
│   │   └── utils.ts          // shared components
│   ├── index.ts
│   ├── init.ts               // createFactory -> factory
│   └── register.ts
...
```

This folder structure is just an example and not a restriction.
