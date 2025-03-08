import { expect } from "chai";
import { EventHeader } from "../../src/telemetry/eventHeader";

describe("EventHeader", () => {
  const extensionName = "test-extension";
  const eventName = "test-event";

  let eventHeader: EventHeader;

  beforeEach(() => {
    eventHeader = new EventHeader(extensionName, eventName);
  });

  it("should correctly store and return the extension name", () => {
    expect(eventHeader.getExtensionName()).to.equal(extensionName);
  });

  it("should correctly store and return the event name", () => {
    expect(eventHeader.getEventName()).to.equal(eventName);
  });

  it("should return a correctly formatted string representation", () => {
    expect(eventHeader.toString()).to.equal(`${extensionName}/${eventName}`);
  });

  it("should handle empty strings for extension and event names", () => {
    const emptyEventHeader = new EventHeader("", "");
    expect(emptyEventHeader.getExtensionName()).to.equal("");
    expect(emptyEventHeader.getEventName()).to.equal("");
    expect(emptyEventHeader.toString()).to.equal("/");
  });

  it("should handle special characters in extension and event names", () => {
    const specialEventHeader = new EventHeader("ext@name", "event#123");
    expect(specialEventHeader.toString()).to.equal("ext@name/event#123");
  });
});
