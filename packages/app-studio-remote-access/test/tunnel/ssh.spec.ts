import { expect } from "chai";
import * as sshModule from "../../src/tunnel/ssh";

describe("ssh unit test", () => {
  describe("closeSessions", () => {
    const ssh = sshModule as any;

    beforeEach(() => {
      ssh.internal.sessionMap.clear();
    });

    it("closeSession, empty sessions", () => {
      ssh.closeSessions();
      expect(ssh.internal.sessionMap.size).to.equal(0);
    });

    it("closeSession, without args", () => {
      ssh.internal.sessionMap.set("server-1", {
        close: () => {},
      });
      ssh.internal.sessionMap.set("server-2", {
        close: () => {},
      });
      ssh.closeSessions();
      expect(ssh.internal.sessionMap.size).to.equal(0);
    });

    it("closeSession, specific sessions provided", () => {
      ssh.internal.sessionMap.set("server-1", {
        close: () => {},
      });
      ssh.internal.sessionMap.set("server-2", {
        close: () => {},
      });
      ssh.internal.sessionMap.set("server-3", {
        close: () => {},
      });
      ssh.closeSessions(["server-1", "server-3"]);
      expect(ssh.internal.sessionMap.size).to.equal(1);
      expect(ssh.internal.sessionMap.has("server-2")).to.be.true;
    });
  });
});
