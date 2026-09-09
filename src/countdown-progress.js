export const DEFAULT_PROGRESS_WINDOW_MINUTES = 60;
export const DEFAULT_YELLOW_THRESHOLD_MINUTES = 30;
export const DEFAULT_RED_THRESHOLD_MINUTES = 10;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function countdownTarget(eventStatus) {
  if (eventStatus.nextEvent?.date instanceof Date) {
    return eventStatus.nextEvent.date;
  }

  if (eventStatus.currentEvent?.end instanceof Date) {
    return eventStatus.currentEvent.end;
  }

  return null;
}

export function getCountdownProgress(
  eventStatus,
  now = new Date(),
  progressWindowMinutes = DEFAULT_PROGRESS_WINDOW_MINUTES,
  yellowThresholdMinutes = DEFAULT_YELLOW_THRESHOLD_MINUTES,
  redThresholdMinutes = DEFAULT_RED_THRESHOLD_MINUTES
) {
  const target = countdownTarget(eventStatus);
  if (target === null) {
    return null;
  }

  const progressWindow = Math.max(1, progressWindowMinutes);
  const yellowThreshold = clamp(
    yellowThresholdMinutes,
    0,
    progressWindow
  );
  const redThreshold = clamp(redThresholdMinutes, 0, yellowThreshold);
  const minutesRemaining = Math.max(
    0,
    Math.ceil((target.getTime() - now.getTime()) / 60000)
  );

  if (minutesRemaining > progressWindow) {
    return null;
  }

  let colorBand = "green";
  if (minutesRemaining <= redThreshold) {
    colorBand = "red";
  } else if (minutesRemaining <= yellowThreshold) {
    colorBand = "yellow";
  }

  return {
    colorBand,
    minutesRemaining,
    fraction: clamp(1 - minutesRemaining / progressWindow, 0, 1),
  };
}
