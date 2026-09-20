import type { Fragment } from "../types";

/**
 * Row payload written from `archive_2/Augmented_IndiaTransactMultiFacet2024.csv`.
 *
 * Privacy: the card number, cardholder name, date of birth, street address,
 * customer id and precise coordinates are dropped during preparation and are
 * never shipped to the browser. Only merchant, category, amount, city and
 * state survive.
 */
export type IndiaPayload = {
  source: "india";
  count: number;
  rows: {
    t: number;
    merchant: string;
    category: string;
    amount: number;
    city: string;
    state: string;
  }[];
};

const MINUTE = 60_000;

const CATEGORY_LABEL: Record<string, string> = {
  online_shopping: "Online shopping",
  travel: "Travel",
  entertainment: "Entertainment",
  fitness_and_medical: "Health & fitness",
  food_and_dining: "Food & dining",
  grocery: "Groceries",
  utilities: "Utilities",
  education: "Education",
};

export function labelCategory(raw: string) {
  if (!raw) return "Card transaction";
  return CATEGORY_LABEL[raw] ?? raw.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Normalize card activity into Fragments, keeping identifiers out of the UI. */
export function normalizeIndia(payload: IndiaPayload): Fragment[] {
  return payload.rows.map((r, i) => {
    const place = [r.city, r.state].filter(Boolean).join(", ");
    const category = labelCategory(r.category);
    return {
      id: `india-${i}`,
      source: "india",
      timestamp: r.t * MINUTE,
      category,
      title: category,
      description: r.merchant ? `Card payment · ${r.merchant}` : "Card payment",
      amount: r.amount,
      currency: "INR",
      ...(place ? { location: place } : {}),
      metadata: {
        merchant: r.merchant,
        rawCategory: r.category,
        ...(r.city ? { city: r.city } : {}),
        ...(r.state ? { state: r.state } : {}),
      },
    } satisfies Fragment;
  });
}
