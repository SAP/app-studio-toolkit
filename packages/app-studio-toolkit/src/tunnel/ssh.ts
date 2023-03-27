import { connection as WebSocket, client as WebSocketClient } from "websocket";

import {
  SshAlgorithms,
  SshSessionConfiguration,
  SshProtocolExtensionNames,
  BaseStream,
  CancellationToken,
  ObjectDisposedError,
  Stream,
  SshClientSession,
  SshDisconnectReason,
} from "@microsoft/dev-tunnels-ssh";
import { PortForwardingService } from "@microsoft/dev-tunnels-ssh-tcp";

let session: SshClientSession;

class WebSocketServerStream extends BaseStream {
  public constructor(private readonly websocket: WebSocket) {
    super();
    if (!websocket) throw new TypeError("WebSocket is required.");

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- ignore warning
    const binaryType = (websocket as any).binaryType;
    if (typeof binaryType === "string" && binaryType !== "arraybuffer") {
      throw new Error("WebSocket must use arraybuffer binary type.");
    }

    websocket.on("message", (data) => {
      if (data.type === "binary") {
        this.onData(data.binaryData);
      }
    });
    websocket.on("close", (code?: number, reason?: string) => {
      if (typeof code === undefined || !code) {
        this.onEnd();
      } else {
        const error = new Error(reason);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        (<any>error).code = code;
        this.onError(error);
      }
    });
  }

  public async write(
    data: Buffer,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress warn
    cancellation?: CancellationToken
  ): Promise<void> {
    if (!data) throw new TypeError("Data is required.");
    if (this.disposed) throw new ObjectDisposedError(this);

    this.websocket.send(data);
    return Promise.resolve();
  }

  public async close(
    error?: Error,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress warn
    cancellation?: CancellationToken
  ): Promise<void> {
    if (this.disposed) throw new ObjectDisposedError(this);

    if (!error) {
      this.websocket.close();
    } else {
      const code: number | undefined =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        typeof (<any>error).code === "number" ? (<any>error).code : undefined;
      this.websocket.drop(code, error.message);
    }
    this.disposed = true;
    this.closedEmitter.fire({ error });
    this.onError(error || new Error("Stream closed."));
    return Promise.resolve();
  }

  public dispose(): void {
    if (!this.disposed) {
      this.websocket.close();
    }

    super.dispose();
  }
}

export async function ssh(opts: {
  host: { url: string; port: string };
  client: { port: string };
  username: string;
  jwt: string;
}): Promise<void> {
  const isContinue = new Promise((res) => {
    if (session) {
      void session
        .close(SshDisconnectReason.byApplication)
        .finally(() => res(true));
    } else {
      res(true);
    }
  });
  await isContinue;

  const config = new SshSessionConfiguration();
  config.keyExchangeAlgorithms.push(
    SshAlgorithms.keyExchange.ecdhNistp521Sha512
  );
  config.publicKeyAlgorithms.push(SshAlgorithms.publicKey.ecdsaSha2Nistp521);
  config.publicKeyAlgorithms.push(SshAlgorithms.publicKey.rsa2048);
  config.encryptionAlgorithms.push(SshAlgorithms.encryption.aes256Gcm);
  config.protocolExtensions.push(SshProtocolExtensionNames.sessionReconnect);
  config.protocolExtensions.push(SshProtocolExtensionNames.sessionLatency);

  config.addService(PortForwardingService);

  const serverUri = `wss://${opts.host.url}:${opts.host.port}`;
  const wsClient = new WebSocketClient();

  wsClient.connect(serverUri, "ssh", undefined, {
    Authorization: `bearer ${opts.jwt}`,
  });
  const stream = await new Promise<Stream>((resolve, reject) => {
    wsClient.on("connect", (connection) => {
      resolve(new WebSocketServerStream(connection));
    });
    wsClient.on("connectFailed", function error(e) {
      reject(new Error(`Failed to connect to server at ${serverUri}:${e}`));
    });
  });

  return new Promise((resolve, reject) => {
    session = new SshClientSession(config);
    void session
      .connect(stream)
      .then(() => {
        void session.onAuthenticating((e) => {
          e.authenticationPromise = Promise.resolve({});
        });

        void session.authenticateClient({
          username: opts.username,
          // publicKeys: [privateKey],
          publicKeys: [],
        });

        const pfs = session.activateService(PortForwardingService);
        void pfs.forwardToRemotePort(
          "127.0.0.1",
          parseInt(opts.client.port, 10),
          "127.0.0.1",
          2222
        );
        console.debug("connected");
      })
      .catch((e) => {
        console.error(e);
        reject(e);
      });
  });
}
