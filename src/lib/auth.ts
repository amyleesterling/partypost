// Admin allowlist check. Empty env var = anyone signed in can host.

export function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST?.trim();
  if (!raw) return true;
  const allowlist = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
