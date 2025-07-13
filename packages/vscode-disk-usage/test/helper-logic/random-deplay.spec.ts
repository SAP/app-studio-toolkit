import { expect } from "chai";
import { performWithRandomDelay } from "../../src/helper-logic/random-delay";

describe("random-delay module", () => {
  context("performWithRandomDelay", () => {
    it("will execute the action after a random delay between min and max minutes", function (done) {
      this.timeout(3000);
      const startTime = Date.now();
      const minMinutes = 1 / 60;
      const maxMinutes = 2 / 60;

      performWithRandomDelay({
        minMinutes,
        maxMinutes,
        action: () => {
          const elapsedTime = Date.now() - startTime;
          const minMs = minMinutes * 60 * 1000;
          const maxMs = maxMinutes * 60 * 1000;

          expect(elapsedTime).to.be.at.least(minMs);
          // allow small buffer for execution time
          expect(elapsedTime).to.be.below(maxMs + 100); //
          done();
        },
      });
    });
  });

  context("edge cases", () => {
    it("will error if minMinutes < maxMinutes", () => {
      expect(() => {
        performWithRandomDelay({
          minMinutes: 10,
          maxMinutes: 5,
          action: () => {},
        });
      }).to.throw("maxMinutes must be >= minMinutes");
    });

    it("will error if minMinute < 0", () => {
      expect(() => {
        performWithRandomDelay({
          minMinutes: -1,
          maxMinutes: 5,
          action: () => {},
        });
      }).to.throw("minMinutes must be >= 0");
    });
  });
});
