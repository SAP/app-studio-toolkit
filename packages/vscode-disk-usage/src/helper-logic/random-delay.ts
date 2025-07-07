import * as assert from "node:assert";
import { getLogger } from "../logger/logger";

export { performWithRandomDelay, clearTimeout };

let timeOut: NodeJS.Timeout | undefined = undefined;

function performWithRandomDelay(opts: {
  minMinutes: number;
  maxMinutes: number;
  action: Function;
}): void {
  assert(opts.minMinutes >= 0, "minMinutes must be >= 0");
  assert(
    opts.maxMinutes >= opts.minMinutes,
    "maxMinutes must be >= minMinutes"
  );

  clearTimeout();
  const minMs = opts.minMinutes * 60 * 1000;
  const maxMs = opts.maxMinutes * 60 * 1000;
  const deltaMs = maxMs - minMs;
  const randomDeltaMs = Math.floor(Math.random() * deltaMs);
  const randomDelayMs = minMs + randomDeltaMs;

  getLogger().info(`chosen random delay: ${randomDelayMs}ms`);
  timeOut = setTimeout(() => {
    opts.action();
  }, randomDelayMs);
}

function clearTimeout(): void {
  if (timeOut) {
    timeOut.unref();
    timeOut = undefined;
  }
}
