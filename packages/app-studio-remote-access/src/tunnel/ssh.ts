import { connection as WebSocket, client as WebSocketClient } from "websocket";
import {
  SshAlgorithms,
  SshSessionConfiguration,
  SshProtocolExtensionNames,
  BaseStream,
  ObjectDisposedError,
  Stream,
  SshClientSession,
  SshDisconnectReason,
} from "@microsoft/dev-tunnels-ssh";
import { PortForwardingService } from "@microsoft/dev-tunnels-ssh-tcp";
import { getLogger } from "../logger/logger";

const sessionMap: Map<string, SshClientSession> = new Map();

/* istanbul ignore next */
class WebSocketClientStream extends BaseStream {
  public constructor(private readonly websocket: WebSocket) {
    super();

    websocket.on("message", (data) => {
      if (data.type === "binary") {
        this.onData(data.binaryData);
      }
    });
    websocket.on("close", (code?: number, reason?: string) => {
      if (!code) {
        this.onEnd();
      } else {
        const error = new Error(reason);
        (<any>error).code = code;
        this.onError(error);
      }
    });
  }

  public async write(data: Buffer): Promise<void> {
    if (this.disposed) {
      throw new ObjectDisposedError(this);
    }
    if (!data) {
      throw new TypeError("Data is required.");
    }

    this.websocket.send(data);
    return Promise.resolve();
  }

  public async close(error?: Error): Promise<void> {
    if (this.disposed) {
      throw new ObjectDisposedError(this);
    }

    if (!error) {
      this.websocket.close();
    } else {
      this.websocket.drop((<any>error).code, error.message);
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

/* istanbul ignore next */
export async function ssh(opts: {
  host: {
    url: string;
    port: string;
  };
  client: {
    port: string;
  };
  username: string;
  jwt: string;
}): Promise<void> {
  const serverUri = `wss://${opts.host.url}:${opts.host.port}`;
  // close the opened session if exists
  const isContinue = new Promise((res) => {
    const session = sessionMap.get(serverUri);
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

  const wsClient = new WebSocketClient();

  wsClient.connect(serverUri, "ssh", undefined, {
    Authorization: `bearer ${opts.jwt}`,
  });
  const stream = await new Promise<Stream>((resolve, reject) => {
    wsClient.on("connect", (connection) => {
      resolve(new WebSocketClientStream(connection));
    });
    wsClient.on("connectFailed", function error(e) {
      reject(new Error(`Failed to connect to server at ${serverUri}:${e}`));
    });
  });

  return new Promise((resolve, reject) => {
    const session = new SshClientSession(config);
    sessionMap.set(serverUri, session);
    void session
      .connect(stream)
      .then(() => {
        void session.onAuthenticating((e) => {
          // there is no authentication in this solution
          e.authenticationPromise = Promise.resolve({});
        });

        // authorise client by name 'user'
        void session.authenticateClient({
          username: opts.username,
          publicKeys: [],
        });

        const pfs = session.activateService(PortForwardingService);
        void pfs
          .forwardToRemotePort(
            "127.0.0.1",
            parseInt(opts.client.port, 10),
            "127.0.0.1",
            2222
          )
          .then(() => {
            getLogger().debug(`ssh session connected`);
          });
      })
      .catch((e) => {
        getLogger().error(`ssh session droped : ${e.message}`);
        reject(e);
      });
  });
}
