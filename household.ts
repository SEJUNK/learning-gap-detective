import type { Fragment } from "../types";

/** Row payload written from `archive_1/Daily Household Transactions.csv`. */
export type HouseholdPayload = {
  source: "household";
  count: number;
  rows: {
    t: number;
    mode: string;
    category: string;
    sub: string;
    note: string;
    amount: number;
    flow: string;
    currency: string;
  }[];
};

const MINUTE = 60_000;

function titleCase(value: string) {
  return value.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Normalize the household ledger into Fragments. */
export function normalizeHousehold(payload: HouseholdPayload): Fragment[] {
  return payload.rows.map((r, i) => {
    const income = r.flow.toLowerCase() === "income";
    const title = r.note || r.sub || r.category || (income ? "Income" : "Expense");
    const parts = [r.sub ? titleCase(r.sub) : "", r.mode].filter(Boolean);
    return {
      id: `household-${i}`,
      source: "household",
      timestamp: r.t * MINUTE,
      category: titleCase(r.category || (income ? "Income" : "Expense")),
      title: titleCase(title),
      description: parts.join(" · "),
      amount: r.amount,
      currency: r.currency || "INR",
      metadata: {
        mode: r.mode,
        subcategory: r.sub,
        flow: income ? "Income" : "Expense",
        note: r.note,
      },
    } satisfies Fragment;
  });
}
