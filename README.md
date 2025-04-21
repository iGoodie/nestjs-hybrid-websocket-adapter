<!-- Logo -->
<p align="center">
  <img src="https://raw.githubusercontent.com/iGoodie/nestjs-hybrid-websocket-adapter/master/.github/assets/logo.svg" height="100px" alt="Logo"/>
</p>
<h1 align="center">
  NestJS: Hybrid Websocket Adapter
</h1>

<!-- Slogan -->
<p align="center">
   Seamlessly unify multiple WebSocketAdapters, to support multiple protocols.
</p>
<!-- Badges -->
<p align="center">

  <!-- Main Badges -->
  <img src="https://raw.githubusercontent.com/iGoodie/paper-editor/master/.github/assets/main-badge.svg" height="20px"/>
  <a href="https://www.npmjs.com/package/nestjs-hybrid-websocket-adapter">
    <img src="https://img.shields.io/npm/v/nestjs-hybrid-websocket-adapter"/>
  </a>
  <a href="https://github.com/iGoodie/nestjs-hybrid-websocket-adapter/tags">
    <img src="https://img.shields.io/github/v/tag/iGoodie/nestjs-hybrid-websocket-adapter"/>
  </a>
  <a href="https://github.com/iGoodie/nestjs-hybrid-websocket-adapter">
    <img src="https://img.shields.io/github/languages/top/iGoodie/nestjs-hybrid-websocket-adapter"/>
  </a>

  <br/>

  <!-- Github Badges -->
  <img src="https://raw.githubusercontent.com/iGoodie/paper-editor/master/.github/assets/github-badge.svg" height="20px"/>
  <a href="https://github.com/iGoodie/nestjs-hybrid-websocket-adapter/commits/master">
    <img src="https://img.shields.io/github/last-commit/iGoodie/nestjs-hybrid-websocket-adapter"/>
  </a>
  <a href="https://github.com/iGoodie/nestjs-hybrid-websocket-adapter/issues">
    <img src="https://img.shields.io/github/issues/iGoodie/nestjs-hybrid-websocket-adapter"/>
  </a>
  <a href="https://github.com/iGoodie/nestjs-hybrid-websocket-adapter/tree/master/src">
    <img src="https://img.shields.io/github/languages/code-size/iGoodie/nestjs-hybrid-websocket-adapter"/>
  </a>

  <br/>

  <!-- Support Badges -->
  <img src="https://raw.githubusercontent.com/iGoodie/paper-editor/master/.github/assets/support-badge.svg" height="20px"/>
  <a href="https://discord.gg/KNxxdvN">
    <img src="https://img.shields.io/discord/610497509437210624?label=discord"/>
  </a>
  <a href="https://www.patreon.com/iGoodie">
    <img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3DiGoodie%26type%3Dpatrons"/>
  </a>
</p>

# Description

Composable WebSocketAdapter for NestJS Gateways, allowing you to seamlessly support multiple underlying server types in one application.

# Features

- 🔌 Compose multiple WebSocket adapters into a single one.

- 🧠 Automatically delegates logic to the correct adapter based on runtime checks.

- 🧪 Clean abstraction for integrating different WebSocket backends.

- 💡 Type-safe and extensible.

# Concept

In a NestJS app, you might want to support different WebSocket implementations (e.g., ws, socket.io, uwebsocket, etc) based on certain conditions.

This library allows you to define multiple adapters with custom matching logic, and automatically selects the appropriate one based on the client/server at runtime.

# Usage

1. Compose your websocket adapters into a HybridWebsocket.

```ts
import { IoAdapter } from "@nestjs/platform-socket.io";
import { WsAdapter } from "@nestjs/platform-ws";
import { composeWebsocketAdapters } from "your-library-name";

const HybridWebsocket = composeWebsocketAdapters({
  SocketIO: {
    adapter: (app) => new IoAdapter(app),
    checkClient: (client) => client instanceof SocketIO.Socket,
    checkServer: (server) =>
      server instanceof SocketIO.Server || server instanceof SocketIO.Namespace,
  },
  WS: {
    adapter: (app) => new WsAdapter(app),
    checkClient: (client) => client instanceof WebSocket.WebSocket,
    checkServer: (server) => server instanceof WebSocket.WebSocketServer,
  },
});
```

2. Create and register an adapter to your Nest App from your composition.

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(HybridWebsocket.createAdapter(app));
  await app.listen(3000);
}
```

3. Use the Gateway decorator from your composition instead of WebSocketGateway.

```ts
@HybridWebsocket.Gateway(3001, {
  type: "SocketIO",
  namespace: "/my-app",
})
export class AppGateway1 {}

@HybridWebsocket.Gateway(3002, {
  type: "WS",
})
export class AppGateway2 {}
```

4. That's it, now your endpoints are ready to be used! 🎉

# Under the Hood

This library uses method proxying to intercept all WebSocketAdapter calls and reroute them to the correct adapter instance at runtime.
It relies on the `type` you define in the `@Gateway` metadata and dynamic type checking on clients and servers to determine routing.

## License

&copy; 2025 Taha Anılcan Metinyurt (iGoodie)

For any part of this work for which the license is applicable, this work is licensed under the [Attribution-ShareAlike 4.0 International](http://creativecommons.org/licenses/by-sa/4.0/) license. (See LICENSE).

<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a>
