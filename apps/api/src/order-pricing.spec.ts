import { describe, expect, it } from "vitest";
import { calculateOrderTotal, canTransitionOrderStatus, validateSplits } from "@qrmenu/types";

describe("order pricing and payment guards", () => {
  it("uses server-side integer menu prices for totals", () => {
    expect(
      calculateOrderTotal([
        { priceKurus: 9900, quantity: 2 },
        { priceKurus: 14500, quantity: 1 }
      ])
    ).toBe(34300);
  });

  it("rejects split sums that do not match the order total", () => {
    expect(validateSplits(34300, [{ amountKurus: 17000 }, { amountKurus: 17300 }])).toBe(true);
    expect(validateSplits(34300, [{ amountKurus: 17000 }, { amountKurus: 17000 }])).toBe(false);
  });

  it("blocks status jumps outside the required chain", () => {
    expect(canTransitionOrderStatus("PENDING", "READY")).toBe(false);
    expect(canTransitionOrderStatus("PENDING", "CONFIRMED")).toBe(true);
  });
});
