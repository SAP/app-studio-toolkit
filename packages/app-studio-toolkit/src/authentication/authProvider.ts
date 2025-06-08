import { authentication, commands, Disposable, EventEmitter } from "vscode";
import type {
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Event,
  SecretStorage,
} from "vscode";
import { retrieveJwt } from "./auth-utils";
import { getLogger } from "../logger/logger";
import { messages } from "../../src/devspace-manager/common/messages";
import { debounce, isEmpty } from "lodash";
import { JwtPayload } from "@sap-devx/app-studio-toolkit-types";

export class BasRemoteAuthenticationProvider
  implements AuthenticationProvider, Disposable
{
  static id = "BASLandscapePAT";
  private secretKey: string = "baslandscapepat";

  // this property is used to determine if the token has been changed in another window of VS Code.
  // It is used in the checkForUpdates function.
  private currentToken: Thenable<string | undefined> | undefined;
  private initializedDisposable: Disposable | undefined;

  private _onDidChangeSessions =
    new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>();
  get onDidChangeSessions(): Event<AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this._onDidChangeSessions.event;
  }

  constructor(private readonly secretStorage: SecretStorage) {}

  dispose(): void {
    this.initializedDisposable?.dispose();
  }

  private ensureInitialized(scopes: string[]): void {
    if (this.initializedDisposable === undefined) {
      void this.cacheTokenFromStorage();

      this.initializedDisposable = Disposable.from(
        // This onDidChange event happens when the secret storage changes in _any window_ since
        // secrets are shared across all open windows.
        this.secretStorage.onDidChange((e) => {
          if (e.key === this.secretKey) {
            void this.checkForUpdates(scopes);
          }
        }),
        // This fires when the user initiates a "silent" auth flow via the Accounts menu.
        authentication.onDidChangeSessions((e) => {
          if (e.provider.id === BasRemoteAuthenticationProvider.id) {
            void this.checkForUpdates(scopes);
            debounce(() => {
              void commands.executeCommand(`local-extension.tree.refresh`);
            }, 1000)();
          }
        })
      );
    }
  }

  // This is a crucial function that handles whether or not the token has changed in
  // a different window of VS Code and sends the necessary event if it has.
  private async checkForUpdates(scopes: string[]): Promise<void> {
    const added: AuthenticationSession[] = [];
    const removed: AuthenticationSession[] = [];
    const changed: AuthenticationSession[] = [];

    const previousToken: JwtPayload | undefined = this.getTokenByScope(
      await this.currentToken,
      scopes
    );
    const session = (await this.getSessions(scopes))[0];

    // Added: session exists but previousToken does not
    if (
      session &&
      (!previousToken || (!previousToken.jwt && !previousToken.iasjwt))
    ) {
      added.push(session);
    }
    // Removed: previousToken exists but session does not
    else if (
      !session &&
      previousToken &&
      (previousToken.jwt || previousToken.iasjwt)
    ) {
      removed.push(new BasRemoteSession(scopes, previousToken));
    }
    // Changed: both exist, but at least one token value differs
    else if (
      session &&
      previousToken &&
      (session.accessToken !== previousToken.jwt ||
        (session as BasRemoteSession).iasToken !== previousToken.iasjwt)
    ) {
      changed.push(session);
    } else {
      return;
    }

    void this.cacheTokenFromStorage();
    this._onDidChangeSessions.fire({
      added,
      removed,
      changed,
    });
  }

  private async cacheTokenFromStorage() {
    this.currentToken = this.secretStorage.get(this.secretKey);
    return this.currentToken;
  }

  private getTokenByScope(
    allScopes: string | undefined,
    _scopes: string[]
  ): JwtPayload | undefined {
    let objToken;
    if (allScopes) {
      objToken = JSON.parse(allScopes);
    }

    let token: JwtPayload | undefined;
    if (objToken) {
      token = !isEmpty(_scopes)
        ? objToken[_scopes[0]]
        : /* indicate user signed in some BAS landscape */ {
            jwt: `dummy-token`,
          };
    }
    return token;
  }

  // This function is called first when `vscode.authentication.getSessions` is called.
  async getSessions(
    _scopes?: string[]
  ): Promise<readonly AuthenticationSession[]> {
    this.ensureInitialized(_scopes || []);

    const payload = this.getTokenByScope(
      await this.cacheTokenFromStorage(),
      _scopes || []
    );
    return payload ? [new BasRemoteSession(_scopes || [], payload)] : [];
  }

  // This function is called after `this.getSessions` is called and only when:
  // - `this.getSessions` returns nothing but `createIfNone` was set to `true` in `vscode.authentication.getSessions`
  // - `vscode.authentication.getSessions` was called with `forceNewSession: true`
  // - The end user initiates the "silent" auth flow via the Accounts menu
  async createSession(_scopes: string[]): Promise<AuthenticationSession> {
    this.ensureInitialized(_scopes);

    const payload = await retrieveJwt(_scopes[0]);

    // Note: consider to do some validation of the token beyond making sure it's not empty.
    if (!payload) {
      getLogger().error(messages.err_get_jwt_required);
      throw new Error(messages.err_get_jwt_required);
    }

    const allScopes = await this.cacheTokenFromStorage();
    const landscapeToken: any = {};
    landscapeToken[_scopes[0]] = payload;
    // Don't set `currentToken` here, since we want to fire the proper events in the `checkForUpdates` call
    await this.secretStorage.store(
      this.secretKey,
      JSON.stringify(
        Object.assign(JSON.parse(allScopes ?? `{}`), landscapeToken)
      )
    );
    getLogger().debug(`Jwt successfully stored for ${_scopes[0]} landscape`);

    return new BasRemoteSession(_scopes, payload);
  }

  // This function is called when the end user signs out of the account.
  async removeSession(_sessionId: string): Promise<void> {
    await this.secretStorage.delete(this.secretKey);
    void this.cacheTokenFromStorage();
  }
}

export class BasRemoteSession implements AuthenticationSession {
  readonly account = {
    id: BasRemoteAuthenticationProvider.id,
    label: "Access Token",
  };
  readonly id = BasRemoteAuthenticationProvider.id;
  public readonly iasToken: string;
  public readonly accessToken: string;

  /**
   * @param accessToken The personal access token to use for authentication
   */
  constructor(public readonly scopes: string[], accessToken: JwtPayload) {
    this.iasToken = accessToken.iasjwt;
    this.accessToken = accessToken.jwt;
  }
}
