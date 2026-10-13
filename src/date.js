const MAX_EVENT_SUMMARY_LENGTH = 35;

function trimLongEventName(summary) {
  if (summary.length > MAX_EVENT_SUMMARY_LENGTH) {
    return summary.substring(0, MAX_EVENT_SUMMARY_LENGTH) + "...";
  } else {
    return summary;
  }
}

function isAllDayEvent(event) {
  return (
    event.date.getHours() === 0 &&
    event.date.getMinutes() === 0 &&
    event.end.getHours() === 0 &&
    event.end.getMinutes() === 0
  );
}

function getEventSummary(event) {
  return trimLongEventName(event.summary);
}

// Returns null while the events can't be read without disturbing the top-bar calendar.
export function getTodaysEvents(calendarSource, showAllDayEvents, calendarOpen) {
  const src = calendarSource;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Get event from today at midnight

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Never shrink the range to today only (see indicator.js). Usually the top-bar month
  // already covers today; otherwise ask for a month either side, unless the user is
  // browsing other months in the open calendar.
  const [begin, end] = [src._lastRequestBegin, src._lastRequestEnd];
  if (!begin || !end || today < begin || tomorrow > end) {
    if (calendarOpen && begin && end) return null;
    const monthBefore = new Date(today);
    monthBefore.setMonth(today.getMonth() - 1);
    const monthAfter = new Date(tomorrow);
    monthAfter.setMonth(tomorrow.getMonth() + 1);
    src.requestRange(monthBefore, monthAfter);
  }

  const rawEvents = src.getEvents(today, tomorrow);
  const todaysEvents = showAllDayEvents
    ? rawEvents
    : rawEvents.filter((event) => !isAllDayEvent(event));

  return todaysEvents;
}

export function getNextEventsToDisplay(todaysEvents) {
  const now = new Date();
  const N = todaysEvents.length;

  let currentEvent = null; // The calendar event the user is currently in
  let nextEvent = null; // The next calendar event coming up
  let done = false;

  for (let i = 0; i < N; i++) {
    if (done) break;

    const event = todaysEvents[i];
    const eventStart = event.date;
    const eventEnd = event.end;

    if (now < eventStart) {
      nextEvent = event;
      break;
    } else if (now < eventEnd) {
      currentEvent = event;

      // Check whether there's an event after this one
      if (i < N - 1) {
        let someNextEvent;

        for (let j = i + 1; j < N; j++) {
          someNextEvent = todaysEvents[j];

          // Check whether the next event overlaps the current event
          // or whether they start at the same time

          if (!(someNextEvent.date.valueOf() === currentEvent.date.valueOf())) {
            nextEvent = someNextEvent;
            done = true;
            break;
          }
        }
      }
    }
  }

  return {
    currentEvent: currentEvent,
    nextEvent: nextEvent,
  };
}

export function eventStatusToIndicatorText(eventStatus, textFormat, customFormats) {
  function displayNextEvent(event) {
    const summary = getEventSummary(event);

    if (isAllDayEvent(event)) {
      return `Next: All day: ${summary}`;
    }

    const timeText = getTimeOfEventAsText(event.date);
    const diffText = getTimeToEventAsText(event.date);

    return `In ${diffText}: ${summary} at ${timeText}`;
  }

  function displayCurrentEventAndNextEventOld(currentEvent, nextEvent) {
    const currentSummary = getEventSummary(currentEvent);
    const nextSummary = getEventSummary(nextEvent);

    if (isAllDayEvent(currentEvent)) {
      return isAllDayEvent(nextEvent)
        ? `All day: ${currentSummary}. Next: All day: ${nextSummary}`
        : `All day: ${currentSummary}. Next: ${nextSummary} at ${getTimeOfEventAsText(nextEvent.date)}`;
    }

    if (isAllDayEvent(nextEvent)) {
      const endsInText = getTimeToEventAsText(currentEvent.end);
      return `Ends in ${endsInText}. Next: All day: ${nextSummary}`;
    }

    const endsInText = getTimeToEventAsText(currentEvent.end);
    const timeText = getTimeOfEventAsText(nextEvent.date);

    return `Ends in ${endsInText}. Next: ${nextSummary} at ${timeText}`;
  }

  function displayCurrentEventAndNextEventNew(currentEvent, nextEvent) {
    const currentSummary = getEventSummary(currentEvent);
    const nextSummary = getEventSummary(nextEvent);

    if (isAllDayEvent(currentEvent)) {
      return isAllDayEvent(nextEvent)
        ? `All day: ${currentSummary} — Next: All day: ${nextSummary}`
        : `All day: ${currentSummary} — Next: ${nextSummary} at ${getTimeOfEventAsText(nextEvent.date)}`;
    }

    if (isAllDayEvent(nextEvent)) {
      const endsInText = getTimeToEventAsText(currentEvent.end);
      return `Ends in ${endsInText}: ${currentSummary} — Next: All day: ${nextSummary}`;
    }

    const endsInText = getTimeToEventAsText(currentEvent.end);
    const timeText = getTimeOfEventAsText(nextEvent.date);

    return `Ends in ${endsInText}: ${currentSummary} — Next: ${nextSummary} at ${timeText}`;
  }

  function displayCustom(currentEvent, nextEvent) {
    const values = {};
    let template = customFormats.none;

    if (currentEvent != null) {
      values.current = getEventSummary(currentEvent);
      values.ends_in = getTimeToEventAsText(currentEvent.end);
      template = customFormats.current;
    }

    if (nextEvent != null) {
      values.next = getEventSummary(nextEvent);
      values.next_time = isAllDayEvent(nextEvent)
        ? "All day"
        : getTimeOfEventAsText(nextEvent.date);
      values.starts_in = getTimeToEventAsText(nextEvent.date);
      template =
        currentEvent != null ? customFormats.currentNext : customFormats.next;
    }

    // Unknown placeholders are left as-is
    return template.replace(/\{(\w+)\}/g, (match, key) =>
      key in values ? values[key] : match
    );
  }

  function displayCurrentEvent(event) {
    if (isAllDayEvent(event)) {
      return `All day: ${getEventSummary(event)}`;
    }

    const endsInText = getTimeToEventAsText(event.end);

    return `Ends in ${endsInText}: ${getEventSummary(event)}`;
  }

  function displayNoEvents() {
    return "Done for today!";
  }

  const { currentEvent, nextEvent } = eventStatus;

  if (textFormat === 2) {
    return displayCustom(currentEvent, nextEvent);
  }

  if (currentEvent != null) {
    if (nextEvent != null) {
      return textFormat === 1
        ? displayCurrentEventAndNextEventNew(currentEvent, nextEvent)
        : displayCurrentEventAndNextEventOld(currentEvent, nextEvent);
    } else {
      return displayCurrentEvent(currentEvent);
    }
  } else {
    if (nextEvent != null) {
      return displayNextEvent(nextEvent);
    } else {
      return displayNoEvents();
    }
  }
}

function getTimeOfEventAsText(eventDate) {
  const hrs = eventDate.getHours();
  let mins = eventDate.getMinutes().toString();

  mins = mins.padStart(2, "0"); // Show e.g. 11:05 instead of 11:5

  const time = `${hrs}:${mins}`;
  return time;
}

function getTimeToEventAsText(eventDate) {
  const now = new Date();
  const diff = Math.abs(eventDate - now);
  const diffInMins = Math.ceil(diff / (1000 * 60));

  const hrDiff = Math.floor(diffInMins / 60);
  const minDiff = diffInMins % 60;

  return hrDiff > 0 ? `${hrDiff} hr ${minDiff} min` : `${minDiff} min`;
}
