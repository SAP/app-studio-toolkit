import { mockVscode } from "./mockUtil";
import { expect } from "chai";
import { SinonSandbox, SinonMock, createSandbox } from "sinon";

let registry: Map<string, () => void>;
const testVscode = {
  commands: {
    registerCommand: (command: string, handler: () => void) => {
      registry.set(command, handler);
    },
  },
};

mockVscode(testVscode, "dist/src/extension.js");
import * as extension from "../src/extension";
import * as logger from "../src/logger/logger";
import { xor } from "lodash";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let commandsMock: SinonMock;
  let loggerMock: SinonMock;

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    registry = new Map<string, () => void>();
    commandsMock = sandbox.mock(testVscode.commands);
    loggerMock = sandbox.mock(logger);
  });

  afterEach(() => {
    commandsMock.verify();
    loggerMock.verify();
  });

  describe("package definitions", () => {
    let packageJson: {
      contributes: {
        menus: {
          commandPalette: {
            when: string;
            command: string;
          }[];
        };
      };
      extensionKind: string[];
      extensionDependencies: string[];
    };

    before(() => {
      packageJson = require("../../package.json");
    });

    it("extension pack definition verifing", () => {
      expect(
        xor(packageJson.extensionDependencies, ["ms-vscode-remote.remote-ssh"])
      ).to.be.empty;
    });

    it("extension kind definition verifing", () => {
      expect(xor(packageJson.extensionKind, ["ui"])).to.be.empty;
    });

    it("commands are unavailable via command palette", () => {
      packageJson.contributes.menus.commandPalette.forEach((command) => {
        expect(command).to.haveOwnProperty("when").to.be.equal("false");
      });
    });
  });

  describe("activate", () => {
    const context: any = {
      subscriptions: {
        push: () => {},
      },
    };

    it("verifying registered commands", () => {
      loggerMock.expects("initLogger").withExactArgs(context);
      extension.activate(context);
      expect(
        xor(
          [...registry.keys()],
          [
            `remote-access.dev-space.connect-new-window`,
            `remote-access.dev-space.clean-devspace-config`,
            `remote-access.close-tunnel`,
          ]
        )
      ).to.be.empty;
    });
  });

  it("deactivate", () => {
    extension.deactivate();
  });
});
