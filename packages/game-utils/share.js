export async function shareText(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error && error.name === "AbortError") return "aborted";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

