import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { WsAdapter } from "@nestjs/platform-ws";
import * as SocketIO from "socket.io";
import * as WebSocket from "ws";
import { composeWebsocketAdapters } from "../../lib/index";

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

/* ------------------------------- */

@HybridWebsocket.Gateway(3001, {
  type: "SocketIO",
  namespace: "/my-app",
})
export class AppGateway1 {}

@HybridWebsocket.Gateway(3002, {
  type: "WS",
})
export class AppGateway2 {}

/* ------------------------------- */

@Module({
  providers: [AppGateway1, AppGateway2],
})
export class AppModule {}

/* ------------------------------- */

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(HybridWebsocket.createAdapter(app));

  await app.listen(3000);
}

bootstrap();
