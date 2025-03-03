import { expect } from "chai";
import {
  ANALYTICS_ENABLED_SETTING_NAME,
  APPINSIGHTS_CONNECTION_STRING,
  ExtensionRunMode,
} from "../../src/telemetry/constants";

describe("Constants and Enums", () => {
  it("should have the correct ANALYTICS_ENABLED_SETTING_NAME", () => {
    expect(ANALYTICS_ENABLED_SETTING_NAME).to.equal("sapbas.telemetryEnabled");
  });

  it("should have the correct APPINSIGHTS_CONNECTION_STRING", () => {
    expect(APPINSIGHTS_CONNECTION_STRING).to.equal(
      "InstrumentationKey=60284eda-c8cc-4794-bdb7-d35f0abb66f9;IngestionEndpoint=https://germanywestcentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://germanywestcentral.livediagnostics.monitor.azure.com/"
    );
  });

  describe("ExtensionRunMode Enum", () => {
    it("should have the correct values for each key", () => {
      expect(ExtensionRunMode.desktop).to.equal("desktop");
      expect(ExtensionRunMode.basRemote).to.equal("bas-remote");
      expect(ExtensionRunMode.basWorkspace).to.equal("bas-workspace");
      expect(ExtensionRunMode.basUi).to.equal("bas-ui");
      expect(ExtensionRunMode.wsl).to.equal("wsl");
      expect(ExtensionRunMode.unexpected).to.equal("unexpected");
    });

    it("should have all expected keys", () => {
      expect(ExtensionRunMode).haveOwnPropertyDescriptor("desktop");
      expect(ExtensionRunMode).haveOwnPropertyDescriptor("basRemote");
      expect(ExtensionRunMode).haveOwnPropertyDescriptor("basWorkspace");
      expect(ExtensionRunMode).haveOwnPropertyDescriptor("basUi");
      expect(ExtensionRunMode).haveOwnPropertyDescriptor("wsl");
      expect(ExtensionRunMode).haveOwnPropertyDescriptor("unexpected");
    });
  });
});
