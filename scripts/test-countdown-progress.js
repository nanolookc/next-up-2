import { getCountdownProgress } from "../src/countdown-progress.js";
import { computeLeftIndicatorWidth } from "../src/panel-geometry.js";

const now = new Date("2026-08-31T10:00:00Z");

function eventStatus(minutesUntilTarget, current = false) {
  const target = new Date(now.getTime() + minutesUntilTarget * 60000);
  return current
    ? { currentEvent: { end: target }, nextEvent: null }
    : { currentEvent: null, nextEvent: { date: target } };
}

function assertProgress(minutes, expectedBand, expectedFraction, current = false) {
  const progress = getCountdownProgress(eventStatus(minutes, current), now);
  if (progress.colorBand !== expectedBand) {
    throw new Error(
      `${minutes} minutes: expected ${expectedBand}, got ${progress.colorBand}`
    );
  }

  if (Math.abs(progress.fraction - expectedFraction) > 0.0001) {
    throw new Error(
      `${minutes} minutes: expected ${expectedFraction}, got ${progress.fraction}`
    );
  }
}

for (const minutes of [90, 61]) {
  const progress = getCountdownProgress(eventStatus(minutes), now);
  if (progress !== null) {
    throw new Error(`${minutes} minutes: expected the progress bar to be hidden`);
  }
}
assertProgress(60, "green", 0);
assertProgress(59, "green", 1 / 60);
assertProgress(31, "green", 29 / 60);
assertProgress(30, "yellow", 0.5);
assertProgress(11, "yellow", 49 / 60);
assertProgress(10, "red", 5 / 6);
assertProgress(9, "red", 0.85);
assertProgress(0, "red", 1);
assertProgress(30, "yellow", 0.5, true);

const overlappingProgress = getCountdownProgress(
  {
    currentEvent: {
      end: new Date(now.getTime() + 93 * 60000),
    },
    nextEvent: {
      date: new Date(now.getTime() + 30 * 60000),
    },
  },
  now
);
if (
  overlappingProgress.colorBand !== "yellow" ||
  Math.abs(overlappingProgress.fraction - 0.5) > 0.0001
) {
  throw new Error(
    "Expected an active event to use the upcoming event's 30-minute countdown"
  );
}

const noEvent = getCountdownProgress(
  { currentEvent: null, nextEvent: null },
  now
);
if (noEvent !== null) {
  throw new Error("Expected no countdown when there is no event");
}

const indicatorWidth = computeLeftIndicatorWidth(1920, 120, 100);
if (indicatorWidth !== 800) {
  throw new Error(`Expected 800px left indicator, got ${indicatorWidth}px`);
}

const clockCenter = 100 + indicatorWidth + 120 / 2;
if (clockCenter !== 1920 / 2) {
  throw new Error(
    `Expected clock center at 960px, got ${clockCenter}px`
  );
}

console.log("Countdown progress and panel geometry checks passed");
