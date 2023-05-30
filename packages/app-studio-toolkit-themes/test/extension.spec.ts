import { expect } from "chai";
import * as extension from "../src/extension";

describe("extension unit test", () => {
  describe("package definitions", () => {
    let packageJson: {
      contributes: {
        themes: [{ label: string; uiTheme: string; path: string }];
      };
    };

    before(() => {
      packageJson = require("../../package.json");
    });

    it("theme contribution verifying", () => {
      expect(packageJson.contributes.themes).deep.equal([
        {
          label: "SAP Fiori Quartz Light",
          uiTheme: "vs",
          path: "./src/themes/light-default-clean.json",
        },
        {
          label: "SAP Fiori Quartz Dark",
          uiTheme: "vs-dark",
          path: "./src/themes/dark-default-clean.json",
        },
        {
          label: "SAP Fiori Evening Horizon",
          uiTheme: "vs-dark",
          path: "./src/themes/dark-fiori-horizon.json",
        },
        {
          label: "SAP Fiori Morning Horizon",
          uiTheme: "vs",
          path: "./src/themes/light-fiori-horizon.json",
        },
      ]);
    });
  });

  describe("activate", () => {
    const context: any = {
      subscriptions: {
        push: () => {},
      },
    };

    it("performs defined actions", () => {
      extension.activate(context);
    });
  });

  it("deactivate", () => {
    extension.deactivate();
  });
});
