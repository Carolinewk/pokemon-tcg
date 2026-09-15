import type { Card } from "./game";

export type ReleaseOrder = "newest" | "oldest";

const cardNumbers = new Intl.Collator("en", { numeric: true });
const releaseDateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function compareCardRelease(a: Card, b: Card, order: ReleaseOrder) {
  const aDate = a.date.replaceAll("/", "-");
  const bDate = b.date.replaceAll("/", "-");
  // Keep undated cards last in either direction.
  if (!aDate && bDate) return 1;
  if (aDate && !bDate) return -1;
  const chronological = aDate.localeCompare(bDate);
  return (
    (order === "newest" ? -chronological : chronological) ||
    a.setId.localeCompare(b.setId) ||
    cardNumbers.compare(a.number, b.number) ||
    a.id.localeCompare(b.id)
  );
}

export function formatCardRelease(date: string) {
  return releaseDateFormat.format(new Date(date.replaceAll("/", "-") + "T00:00:00Z"));
}
