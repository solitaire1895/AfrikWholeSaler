// Order journey shown on tracking pages (safe for client and server).

export const TRACKING_STEPS = [
  "placed",
  "paid",
  "sourcing",
  "quality_check",
  "shipped",
  "customs",
  "out_for_delivery",
  "delivered",
] as const;
export type TrackingStep = (typeof TRACKING_STEPS)[number];

/** Same ranks as tracking_stage_rank() in supabase/order_tracking.sql. */
const RANK: Record<string, number> = {
  placed: 0,
  confirmed: 1,
  sourcing: 3,
  quality_check: 4,
  packed: 5,
  shipped: 6,
  in_transit: 7,
  customs: 8,
  out_for_delivery: 9,
  delivered: 10,
};

/** Minimum rank that completes each step (paid is tracked separately). */
const STEP_RANK: Record<Exclude<TrackingStep, "paid">, number> = {
  placed: 0,
  sourcing: 3,
  quality_check: 4,
  shipped: 6,
  customs: 8,
  out_for_delivery: 9,
  delivered: 10,
};

/** Stages staff can post as a tracking update. */
export const STAFF_STAGES = [
  "update",
  "sourcing",
  "quality_check",
  "packed",
  "shipped",
  "in_transit",
  "customs",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;
export type StaffStage = (typeof STAFF_STAGES)[number];

/** Staff stage → shipment status it implies (moves the shipment forward). */
export const STAGE_TO_SHIPMENT_STATUS: Partial<Record<StaffStage, string>> = {
  packed: "packed",
  shipped: "dispatched",
  in_transit: "in_transit",
  customs: "customs",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  exception: "exception",
};

/** Staff stage → order status it implies when the order has no shipment yet. */
export const STAGE_TO_ORDER_STATUS: Partial<Record<StaffStage, string>> = {
  sourcing: "processing",
  quality_check: "quality_check",
  packed: "quality_check",
  shipped: "shipped",
  in_transit: "shipped",
  customs: "in_transit",
  out_for_delivery: "in_transit",
  delivered: "delivered",
};

export interface StepState {
  step: TrackingStep;
  done: boolean;
  current: boolean;
}

/** Which journey steps are done, from the stages logged so far. */
export function computeSteps(stages: string[]): { steps: StepState[]; cancelled: boolean; problem: boolean } {
  const maxRank = Math.max(-1, ...stages.map((s) => RANK[s] ?? -1));
  const paid = stages.includes("paid") || stages.includes("deposit_paid");
  const doneFlags = TRACKING_STEPS.map((step) =>
    step === "paid" ? paid || maxRank >= RANK.sourcing : maxRank >= STEP_RANK[step]
  );
  const firstOpen = doneFlags.indexOf(false);
  const cancelled = stages.includes("cancelled") && !stages.includes("delivered");
  return {
    steps: TRACKING_STEPS.map((step, i) => ({ step, done: doneFlags[i], current: !cancelled && i === firstOpen })),
    cancelled,
    // A delivery problem is open until the journey moves forward again.
    problem: stages.length > 0 && stages[stages.length - 1] === "exception",
  };
}
