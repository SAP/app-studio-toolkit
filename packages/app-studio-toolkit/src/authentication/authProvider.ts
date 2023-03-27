import {
  authentication,
  AuthenticationProvider,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
  AuthenticationSession,
  Disposable,
  Event,
  EventEmitter,
  SecretStorage,
} from "vscode";
import { retrieveJwt } from "./auth-utils";

export class BasRemoteAuthenticationProvider
  implements AuthenticationProvider, Disposable
{
  static id = "bas-authenticator";
  private secretKey: string = "bas";

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
      void this.cacheTokenFromStorage(scopes);

      this.initializedDisposable = Disposable.from(
        // This onDidChange event happens when the secret storage changes in _any window_ since
        // secrets are shared across all open windows.
        this.secretStorage.onDidChange((e) => {
          if (e.key === `${this.secretKey}_${scopes[0]}`) {
            void this.checkForUpdates(scopes);
          }
        }),
        // This fires when the user initiates a "silent" auth flow via the Accounts menu.
        authentication.onDidChangeSessions((e) => {
          if (e.provider.id === BasRemoteAuthenticationProvider.id) {
            void this.checkForUpdates(scopes);
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

    const previousToken = await this.currentToken;
    const session = (await this.getSessions(scopes))[0];

    if (session?.accessToken && !previousToken) {
      added.push(session);
    } else if (!session?.accessToken && previousToken) {
      removed.push(session);
    } else if (session?.accessToken !== previousToken) {
      changed.push(session);
    } else {
      return;
    }

    void this.cacheTokenFromStorage(scopes);
    this._onDidChangeSessions.fire({
      added: added,
      removed: removed,
      changed: changed,
    });
  }

  private async cacheTokenFromStorage(scopes: string[]) {
    this.currentToken = this.secretStorage.get(
      `${this.secretKey}_${scopes[0]}`
    );
    return this.currentToken;
  }

  // This function is called first when `vscode.authentication.getSessions` is called.
  async getSessions(
    _scopes?: string[]
  ): Promise<readonly AuthenticationSession[]> {
    this.ensureInitialized(_scopes || []);
    const token = await this.cacheTokenFromStorage(_scopes || []);
    return token
      ? [
          new BasRemoteSession(
            BasRemoteAuthenticationProvider.id,
            _scopes || [],
            token
          ),
        ]
      : [];
  }

  // This function is called after `this.getSessions` is called and only when:
  // - `this.getSessions` returns nothing but `createIfNone` was set to `true` in `vscode.authentication.getSessions`
  // - `vscode.authentication.getSessions` was called with `forceNewSession: true`
  // - The end user initiates the "silent" auth flow via the Accounts menu
  async createSession(_scopes: string[]): Promise<AuthenticationSession> {
    this.ensureInitialized(_scopes);

    const token = await retrieveJwt(_scopes[0]);

    // Note: this example doesn't do any validation of the token beyond making sure it's not empty.
    if (!token) {
      throw new Error("PAT is required");
    }

    // Don't set `currentToken` here, since we want to fire the proper events in the `checkForUpdates` call
    await this.secretStorage.store(`${this.secretKey}_${_scopes[0]}`, token);
    console.log(`Successfully logged in ${_scopes[0]} landscape`);

    return new BasRemoteSession(
      BasRemoteAuthenticationProvider.id,
      _scopes,
      token
    );
  }

  // This function is called when the end user signs out of the account.
  async removeSession(_sessionId: string): Promise<void> {
    // await this.secretStorage.delete(`${this.secretKey}_${scopes[0]}`);
  }
}

class BasRemoteSession implements AuthenticationSession {
  // We don't know the user's account name, so we'll just use a constant
  account; // = { id: BasRemoteAuthenticationProvider.id, label: 'Personal Access Token' };
  // // This id isn't used for anything in this example, so we set it to a constant
  //private readonly id; // = BasRemoteAuthenticationProvider.id;
  // We don't know what scopes the PAT has, so we have an empty array here.
  // readonly scopes = [];

  /**
   *
   * @param accessToken The personal access token to use for authentication
   */
  constructor(
    readonly id: string,
    readonly scopes: string[],
    public readonly accessToken: string
  ) {
    this.account = { id: id, label: "Personal Access Token" };
  }
}
