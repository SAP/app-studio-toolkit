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

/* istanbul ignore next */
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

    const previousToken = this.getTokenByScope(await this.currentToken, scopes);
    const session = (await this.getSessions(scopes))[0];

    if (session?.accessToken && !previousToken) {
      added.push(session);
    } else if (!session?.accessToken && previousToken) {
      removed.push(new BasRemoteSession(scopes, previousToken));
    } else if (session?.accessToken !== previousToken) {
      changed.push(session);
    } else {
      return;
    }

    void this.cacheTokenFromStorage();
    this._onDidChangeSessions.fire({
      added: added,
      removed: removed,
      changed: changed,
    });
  }

  private async cacheTokenFromStorage() {
    this.currentToken = this.secretStorage.get(this.secretKey);
    return this.currentToken;
  }

  private getTokenByScope(
    allScopes: string | undefined,
    _scopes: string[]
  ): string | undefined {
    let objToken;
    if (allScopes) {
      objToken = JSON.parse(allScopes);
    }

    let token: string | undefined;
    if (objToken) {
      token = !isEmpty(_scopes)
        ? objToken[_scopes[0]]
        : /* indicate user signed in some BAS landscape */ `dummy-token`;
    }
    return token;
  }

  // This function is called first when `vscode.authentication.getSessions` is called.
  async getSessions(
    _scopes?: string[]
  ): Promise<readonly AuthenticationSession[]> {
    this.ensureInitialized(_scopes || []);

    const token = this.getTokenByScope(
      await this.cacheTokenFromStorage(),
      _scopes || []
    );
    return token ? [new BasRemoteSession(_scopes || [], token)] : [];
  }

  // This function is called after `this.getSessions` is called and only when:
  // - `this.getSessions` returns nothing but `createIfNone` was set to `true` in `vscode.authentication.getSessions`
  // - `vscode.authentication.getSessions` was called with `forceNewSession: true`
  // - The end user initiates the "silent" auth flow via the Accounts menu
  async createSession(_scopes: string[]): Promise<AuthenticationSession> {
    this.ensureInitialized(_scopes);

    const token = await retrieveJwt(_scopes[0]);

    // Note: consider to do some validation of the token beyond making sure it's not empty.
    if (!token) {
      getLogger().error(messages.err_get_jwt_required);
      throw new Error(messages.err_get_jwt_required);
    }

    const allScopes = await this.cacheTokenFromStorage();
    const landscapeToken: any = {};
    landscapeToken[_scopes[0]] = token;
    // Don't set `currentToken` here, since we want to fire the proper events in the `checkForUpdates` call
    await this.secretStorage.store(
      this.secretKey,
      JSON.stringify(
        Object.assign(JSON.parse(allScopes ?? `{}`), landscapeToken)
      )
    );
    getLogger().debug(`Jwt successfully stored for ${_scopes[0]} landscape`);

    return new BasRemoteSession(_scopes, token);
  }

  // This function is called when the end user signs out of the account.
  async removeSession(_sessionId: string): Promise<void> {
    await this.secretStorage.delete(this.secretKey);
    void this.cacheTokenFromStorage();
  }
}

/* istanbul ignore next */
class BasRemoteSession implements AuthenticationSession {
  readonly account = {
    id: BasRemoteAuthenticationProvider.id,
    label: "BAS Access Token",
  };
  readonly id = BasRemoteAuthenticationProvider.id;

  /**
   * @param accessToken The personal access token to use for authentication
   */
  constructor(
    public readonly scopes: string[],
    public readonly accessToken: string
  ) {}
}
