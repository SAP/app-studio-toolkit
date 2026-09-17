import { expect } from "chai";
import * as sinon from "sinon";
import { describe, afterEach, it } from "mocha";
import * as logger from "../src/logger";

describe("Logger", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("Test log method - SHOW_LOG env variable defined", () => {
    sinon.stub(process, "env").value({ SHOW_LOG: "true" });
    const logSpy = sinon.stub(console, "log");
    logger.log("some message");
    expect(logSpy.callCount).to.equal(1);
  });

  it("Test log method - SHOW_LOG env variable is empty string", () => {
    sinon.stub(process, "env").value({ SHOW_LOG: "" });
    const logSpy = sinon.stub(console, "log");
    logger.log("some message");
    expect(logSpy.callCount).to.equal(0);
  });

  it("Test log method - SHOW_LOG env variable not defined", () => {
    sinon.stub(process, "env").value({});
    const logSpy = sinon.stub(console, "log");
    logger.log("some message");
    expect(logSpy.callCount).to.equal(0);
  });
});
