import { expect } from "chai";
import { hasPreviousReportExpired } from "../../src/helper-logic/has-previous-report-expired";
import { DISK_USAGE_TIMESTAMP } from "../../src/helper-logic/constants";
import { MementoMap } from "../memento-mock";

describe("has-previous-report-expired module", () => {
  context("hasPreviousReportExpired() function", () => {
    const dayInMs = 24 * 60 * 60 * 1000;
    it("should return true when the previous report has expired", async () => {
      const globalState = new MementoMap();
      const eightDaysAgoMs = Date.now() - 8 * dayInMs;
      await globalState.update(DISK_USAGE_TIMESTAMP, eightDaysAgoMs);

      const result = await hasPreviousReportExpired({
        globalState,
        daysBetweenRuns: 7,
      });

      expect(result).to.be.true;
    });

    it("should return false when the previous report has not expired", async () => {
      const globalState = new MementoMap();
      const fourDaysAgoMs = Date.now() - 4 * dayInMs;
      await globalState.update(DISK_USAGE_TIMESTAMP, fourDaysAgoMs);

      const result = await hasPreviousReportExpired({
        globalState,
        daysBetweenRuns: 7,
      });

      expect(result).to.be.false;
    });

    it("should create a 'made up' previous report time if none exists", async () => {
      const globalState = new MementoMap();

      expect(globalState.get(DISK_USAGE_TIMESTAMP)).to.not.exist;
      const result = await hasPreviousReportExpired({
        globalState,
        daysBetweenRuns: 7,
      });

      expect(result).to.be.false;
      const timestampAfter = globalState.get(DISK_USAGE_TIMESTAMP) as number;
      expect(timestampAfter).to.exist;
      const sevenDaysAgoInMs = Date.now() - 7 * dayInMs;
      expect(timestampAfter).to.be.lessThan(Date.now());
      // `-1000` because the "made up" timestamp is created in the past inside `hasPreviousReportExpired()`
      expect(timestampAfter - 1000).to.be.greaterThan(sevenDaysAgoInMs);
    });

    it("should create a 'made up' previous report time if it is an invalid datatype", async () => {
      const globalState = new MementoMap();
      await globalState.update(DISK_USAGE_TIMESTAMP, "not-a-number");
      const result = await hasPreviousReportExpired({
        globalState,
        daysBetweenRuns: 7,
      });

      expect(result).to.be.false;
      const timestampAfter = globalState.get(DISK_USAGE_TIMESTAMP) as number;
      expect(timestampAfter).to.exist;
      const sevenDaysAgoInMs = Date.now() - 7 * dayInMs;
      expect(timestampAfter).to.be.lessThan(Date.now());
      // `-1000` because the "made up" timestamp is created in the past inside `hasPreviousReportExpired()`
      expect(timestampAfter - 1000).to.be.greaterThan(sevenDaysAgoInMs);
    });
  });
});
