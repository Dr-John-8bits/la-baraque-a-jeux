const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getDateId(date = new Date(), options = {}) {
  return formatDateParts(getDateParts(date, options.timeZone));
}

export function getRelativeDateId(offset, from = new Date(), options = {}) {
  const date = new Date(from);
  if (options.timeZone) {
    return getDateId(new Date(date.getTime() + offset * DAY_IN_MS), options);
  }
  date.setDate(date.getDate() + offset);
  return getDateId(date);
}

export function getDailyDateId(date = new Date(), options = {}) {
  const rolloverHour = options.rolloverHour ?? 0;
  const parts = getDateParts(date, options.timeZone);
  if (Number(parts.hour) < rolloverHour) {
    return getRelativeDateId(-1, date, { timeZone: options.timeZone });
  }
  return formatDateParts(parts);
}

export function getDailyIndex(dateId, itemCount, epochId = "2026-01-01") {
  if (!itemCount) return 0;
  const current = Date.parse(`${dateId}T00:00:00Z`);
  const epoch = Date.parse(`${epochId}T00:00:00Z`);
  const offset = Math.floor((current - epoch) / 86400000);
  return ((offset % itemCount) + itemCount) % itemCount;
}

export function selectDailyItem(items, dateId = getDateId(), options = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Daily selection needs a non-empty item list.");
  }
  return items[getDailyIndex(dateId, items.length, options.epochId)];
}

function getDateParts(date, timeZone) {
  if (!timeZone) {
    return {
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1).padStart(2, "0"),
      day: String(date.getDate()).padStart(2, "0"),
      hour: String(date.getHours()).padStart(2, "0"),
    };
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
  };
}

function formatDateParts(parts) {
  return `${parts.year}-${parts.month}-${parts.day}`;
}
