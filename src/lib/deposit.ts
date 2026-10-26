// Deposit rules for big orders (safe for client and server).
// Orders of DEPOSIT_THRESHOLD_USD or more can pay DEPOSIT_RATE now and the
// balance before shipping. Keep in sync with supabase/deposits.sql.

export const DEPOSIT_THRESHOLD_USD = 1000;
export const DEPOSIT_RATE = 0.3;

export interface PayableOrder {
  totalAmount: number;
  walletApplied?: number;
  amountPaid?: number;
  awaitingPrice?: boolean;
  paymentStatus?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** What the customer owes in total (after the affiliate wallet). */
export function amountDue(o: PayableOrder): number {
  return round2(Math.max(0, o.totalAmount - (o.walletApplied ?? 0)));
}

/** What's still left to pay. */
export function balanceDue(o: PayableOrder): number {
  return round2(Math.max(0, amountDue(o) - (o.amountPaid ?? 0)));
}

/** Nothing paid yet, price known, and big enough for a deposit. */
export function canPayDeposit(o: PayableOrder): boolean {
  return (
    !o.awaitingPrice &&
    (o.amountPaid ?? 0) <= 0 &&
    o.paymentStatus !== "paid" &&
    o.totalAmount >= DEPOSIT_THRESHOLD_USD &&
    amountDue(o) > 0
  );
}

/** 30% of what's owed. */
export function depositAmount(o: PayableOrder): number {
  return round2(amountDue(o) * DEPOSIT_RATE);
}
