function isAllDayEvent(event) {
  return (
    event.date.getHours() === 0 &&
    event.date.getMinutes() === 0 &&
    event.end.getHours() === 0 &&
    event.end.getMinutes() === 0
  );
}

function getEventSummary(event) {
  return event.summary;
}

export function getTodaysEvents(calendarSource, showAllDayEvents) {
  const src = calendarSource;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  src.requestRange(today, tomorrow);

  const rawEvents = src.getEvents(today, tomorrow);
  return showAllDayEvents
    ? rawEvents
    : rawEvents.filter((event) => !isAllDayEvent(event));
}

export function getNextEventsToDisplay(todaysEvents) {
  const now = new Date();
  const N = todaysEvents.length;

  let currentEvent = null;
  let nextEvent = null;
  let done = false;

  for (let i = 0; i < N; i++) {
    if (done) break;

    const event = todaysEvents[i];
    if (now < event.date) {
      nextEvent = event;
      break;
    } else if (now < event.end) {
      currentEvent = event;
      // Check whether there's an event after this one
      if (i < N - 1) {
        for (let j = i + 1; j < N; j++) {
          let someNextEvent = todaysEvents[j];
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

  return { currentEvent, nextEvent };
}

// Added layoutStyle parameter
export function eventStatusToIndicatorText(eventStatus, textFormat, layoutStyle = 0) {
  const isMin = layoutStyle === 1;

  function displayNextEvent(event) {
    const summary = getEventSummary(event);
    if (isAllDayEvent(event)) return isMin ? `Next: ${summary}` : `Next: All day: ${summary}`;
    
    return isMin 
      ? `${getTimeOfEventAsText(event.date)}: ${summary}` 
      : `In ${getTimeToEventAsText(event.date)}: ${summary} at ${getTimeOfEventAsText(event.date)}`;
  }

  function displayCurrentEventAndNextEventOld(currentEvent, nextEvent) {
    const currentSummary = getEventSummary(currentEvent);
    const nextSummary = getEventSummary(nextEvent);

    if (isMin) {
      return `${currentSummary} (${getTimeToEventAsText(currentEvent.end, true)}) | Next: ${nextSummary} at ${getTimeOfEventAsText(nextEvent.date)}`;
    }

    if (isAllDayEvent(currentEvent)) {
      return isAllDayEvent(nextEvent)
        ? `All day: ${currentSummary}. Next: All day: ${nextSummary}`
        : `All day: ${currentSummary}. Next: ${nextSummary} at ${getTimeOfEventAsText(nextEvent.date)}`;
    }

    if (isAllDayEvent(nextEvent)) {
      return `Ends in ${getTimeToEventAsText(currentEvent.end)}. Next: All day: ${nextSummary}`;
    }

    return `Ends in ${getTimeToEventAsText(currentEvent.end)}. Next: ${nextSummary} at ${getTimeOfEventAsText(nextEvent.date)}`;
  }

  function displayCurrentEventAndNextEventNew(currentEvent, nextEvent) {
    const currentSummary = getEventSummary(currentEvent);
    const nextSummary = getEventSummary(nextEvent);

    if (isMin) {
      return `${currentSummary} (${getTimeToEventAsText(currentEvent.end, true)}) — ${nextSummary} @ ${getTimeOfEventAsText(nextEvent.date)}`;
    }

    if (isAllDayEvent(currentEvent)) {
      return isAllDayEvent(nextEvent)
        ? `All day: ${currentSummary} — Next: All day: ${nextSummary}`
        : `All day: ${currentSummary} — Next: ${nextSummary} at ${getTimeOfEventAsText(nextEvent.date)}`;
    }

    if (isAllDayEvent(nextEvent)) {
      return `Ends in ${getTimeToEventAsText(currentEvent.end)}: ${currentSummary} — Next: All day: ${nextSummary}`;
    }

    return `Ends in ${getTimeToEventAsText(currentEvent.end)}: ${currentSummary} — Next: ${nextSummary} at ${getTimeOfEventAsText(nextEvent.date)}`;
  }

  function displayCurrentEvent(event) {
    const summary = getEventSummary(event);
    if (isAllDayEvent(event)) return isMin ? summary : `All day: ${summary}`;
    
    return isMin 
      ? `${summary} (${getTimeToEventAsText(event.end, true)} left)` 
      : `Ends in ${getTimeToEventAsText(event.end)}: ${summary}`;
  }

  const { currentEvent, nextEvent } = eventStatus;

  if (currentEvent != null) {
    if (nextEvent != null) {
      return textFormat === 1
        ? displayCurrentEventAndNextEventNew(currentEvent, nextEvent)
        : displayCurrentEventAndNextEventOld(currentEvent, nextEvent);
    } else {
      return displayCurrentEvent(currentEvent);
    }
  } else if (nextEvent != null) {
    return displayNextEvent(nextEvent);
  } else {
    return "Done for today!"; 
  }
}

function getTimeOfEventAsText(eventDate) {
  const hrs = eventDate.getHours();
  let mins = eventDate.getMinutes().toString().padStart(2, "0");
  return `${hrs}:${mins}`;
}

// Added minimal boolean to format short time units (e.g., 1h 5m)
function getTimeToEventAsText(eventDate, minimal = false) {
  const now = new Date();
  const diff = Math.abs(eventDate - now);
  const diffInMins = Math.ceil(diff / (1000 * 60));
  const hrDiff = Math.floor(diffInMins / 60);
  const minDiff = diffInMins % 60;

  if (minimal) {
    return hrDiff > 0 ? `${hrDiff}h ${minDiff}m` : `${minDiff}m`;
  }
  return hrDiff > 0 ? `${hrDiff} hr ${minDiff} min` : `${minDiff} min`;
}
