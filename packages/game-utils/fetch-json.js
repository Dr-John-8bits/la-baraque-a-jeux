export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Impossible de charger ${url}`);
  return response.json();
}

