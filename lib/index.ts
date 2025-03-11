import { INestApplication, WebSocketAdapter } from "@nestjs/common";
import { GatewayMetadata, WebSocketGateway } from "@nestjs/websockets";

type ExtractArgs<T> = T extends (...args: infer A) => any ? A : never;
type ExtractReturn<T> = T extends (...args: any) => infer R ? R : never;

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export interface AdapterConfig {
  adapter: (app: INestApplication) => WebSocketAdapter;
  checkClient: (client: any) => boolean;
  checkServer: (server: any) => boolean;
}

export type AdaptersConfig = Record<string, AdapterConfig>;

export type AdapterRegistry<C extends AdaptersConfig> = Record<
  keyof C,
  Prettify<
    {
      type: keyof C;
      adapter: WebSocketAdapter;
    } & Omit<AdapterConfig, "adapter">
  >
>;

export class ComposedSocketAdapter<C extends AdaptersConfig>
  implements WebSocketAdapter
{
  protected readonly registry: AdapterRegistry<C>;

  constructor(
    protected readonly app: INestApplication<any>,
    protected readonly configs: C
  ) {
    this.registry = Object.fromEntries(
      Object.entries(configs).map(([type, config]) => [
        type as keyof C,
        {
          ...config,
          type: type as keyof C,
          adapter: config.adapter(app),
        },
      ])
    ) as AdapterRegistry<C>;
  }

  protected getMatchingAdapter(targetType: "client" | "server", target: any) {
    const [type, entry] =
      Object.entries(this.registry).find(([, entry]) =>
        targetType === "server"
          ? entry.checkServer(target)
          : entry.checkClient(target)
      ) ?? [];

    if (type == null) {
      console.log(this.registry);
      console.log(type, entry, target);
      throw new Error("Could not find a matching " + targetType);
    }

    return entry;
  }

  protected proxyHandle<
    K extends keyof WebSocketAdapter,
    $args extends any[] = ExtractArgs<WebSocketAdapter[K]>,
    $return = ExtractReturn<WebSocketAdapter[K]>,
  >(
    method: K,
    typeExtractor: (...args: NoInfer<$args>) => keyof C
  ): WebSocketAdapter[K] {
    const proxy = (...args: $args): $return => {
      const type = typeExtractor(...args);
      const { adapter } = this.registry[type] ?? {};

      if (adapter == null) {
        throw new Error("Unknown server type -> " + type.toString());
      }

      const methodImpl = adapter[method] as Function;
      return Reflect.apply(methodImpl, adapter, args);
    };
    return proxy as any as WebSocketAdapter[K];
  }

  create = this.proxyHandle(
    "create",
    (port, opts: { type: keyof C }) => opts.type
  );

  bindClientConnect = this.proxyHandle(
    "bindClientConnect",
    (server, cb) => this.getMatchingAdapter("server", server).type
  );

  bindClientDisconnect = this.proxyHandle(
    "bindClientDisconnect",
    (client, cb) => this.getMatchingAdapter("client", client).type
  );

  bindMessageHandlers: WebSocketAdapter["bindMessageHandlers"] =
    this.proxyHandle(
      "bindMessageHandlers",
      (client, handlers, transform) =>
        this.getMatchingAdapter("client", client).type
    );

  close = this.proxyHandle(
    "close",
    (server) => this.getMatchingAdapter("server", server).type
  );
}

export function composeWebsocketAdapters<C extends AdaptersConfig>(configs: C) {
  return {
    createAdapter: (app: INestApplication) =>
      new ComposedSocketAdapter(app, configs),
    Gateway: WebSocketGateway<GatewayMetadata & { type: keyof C }>,
  };
}
