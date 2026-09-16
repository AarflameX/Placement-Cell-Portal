/**
 * Validates a resume URL.
 * @param {string} url
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateResumeUrl(url) {
  const trimmed = (url ?? "").trim();
  if (!trimmed) {
    return { isValid: false, error: "Please paste a link to your resume." };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { isValid: false, error: "The link must start with http:// or https://." };
  }

  return { isValid: true, error: null };
}
