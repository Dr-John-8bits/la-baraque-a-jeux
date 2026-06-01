export function getDateId(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getRelativeDateId(offset, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + offset);
  return getDateId(date);
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

