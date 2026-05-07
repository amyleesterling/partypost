import { customAlphabet } from "nanoid";

const suffixGen = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 5);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Privacy-safe slug per spec §11: human-readable + unguessable suffix.
// e.g. ("Sophia", 7) -> "sophia-7-x8k2m"
export function buildPartySlug(birthdayChildName: string, age?: number | null): string {
  const base = slugify(birthdayChildName) || "party";
  const ageSuffix = age != null && age > 0 ? `-${age}` : "";
  return `${base}${ageSuffix}-${suffixGen()}`;
}

export function generateEditToken(): string {
  return customAlphabet(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    24,
  )();
}
