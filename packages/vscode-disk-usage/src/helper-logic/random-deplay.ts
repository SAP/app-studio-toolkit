import * as assert from "node:assert";

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

  const delta = opts.maxMinutes - opts.minMinutes;
  const randomDelta = Math.floor(Math.random() * delta);
  const randomDelayMs = (opts.minMinutes + randomDelta) * 60 * 1000;
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
