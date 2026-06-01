export function seededShuffle(items, seed) {
  const copy = [...items];
  let value = seed || 1;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    value = (value * 16807) % 2147483647;
    const swapIndex = value % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) || 1;
}

