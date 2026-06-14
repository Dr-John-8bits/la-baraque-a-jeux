export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // localStorage indisponible (mode privé, quota plein, accès bloqué) :
    // la persistance est best-effort, on ne casse pas la partie en cours.
    return false;
  }
}

