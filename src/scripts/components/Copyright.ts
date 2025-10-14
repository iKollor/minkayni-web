import type { Maybe } from "@graphql-tools/utils";

// utils/copyright.ts
export function formatCopyright(c: {
  legalName: string;
  yearStart: number | Maybe<number>;
  autoYear?: boolean | Maybe<boolean>;
  yearOverride?: number | Maybe<number>;
}) {
  const now = new Date().getFullYear();
  const start = c.yearStart;
  const end = c.autoYear !== false ? now : (c.yearOverride ?? start);
  const range = start && end && end > start ? `${start}–${end}` : `${start || end}`;
  return `© ${range} ${c.legalName}`;
}
