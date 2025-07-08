import * as assert from "node:assert";
import { getLogger } from "../logger/logger";

export { performWithRandomDelay, clearTimeout };

const timeOut: NodeJS.Timeout | undefined = undefined;

function performWithRandomDelay(opts: {
  minMinutes: number;
  maxMinutes: number;
  action: Function;
}): NodeJS.Timeout {
  assert(opts.minMinutes >= 0, "minMinutes must be >= 0");
  assert(
    opts.maxMinutes >= opts.minMinutes,
    "maxMinutes must be >= minMinutes"
  );

  const minMs = opts.minMinutes * 60 * 1000;
  const maxMs = opts.maxMinutes * 60 * 1000;
  const deltaMs = maxMs - minMs;
  const randomDeltaMs = Math.floor(Math.random() * deltaMs);
  const randomDelayMs = minMs + randomDeltaMs;

  getLogger().info(`chosen random delay: ${randomDelayMs}ms`);
  const timeOut = setTimeout(() => {
    opts.action();
  }, randomDelayMs);

  return timeOut;
}
