const redirectOrigin = "https://internal.invalid";

export function getSafeRedirectPath(value) {
  if (typeof value !== "string") return null;

  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return null;
  }

  try {
    const target = new URL(candidate, redirectOrigin);
    if (target.origin !== redirectOrigin) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}
