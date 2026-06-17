import { describe, expect, it } from "vitest";
import {
  calculateOrderTotal,
  canTransitionOrderStatus,
  createEqualSplits,
  validateSplits
} from "./index";

describe("money helpers", () => {
  it("calculates order totals in integer kurus", () => {
    expect(
      calculateOrderTotal([
        { priceKurus: 4500, quantity: 2 },
        { priceKurus: 1200, quantity: 1 }
      ])
    ).toBe(10200);
  });

  it("splits totals without losing remainder kurus", () => {
    expect(createEqualSplits(10000, 3)).toEqual([3334, 3333, 3333]);
  });

  it("validates split totals", () => {
    expect(validateSplits(10000, [{ amountKurus: 4000 }, { amountKurus: 6000 }])).toBe(true);
    expect(validateSplits(10000, [{ amountKurus: 4000 }, { amountKurus: 5000 }])).toBe(false);
  });
});

describe("order transitions", () => {
  it("allows the required forward status chain", () => {
    expect(canTransitionOrderStatus("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransitionOrderStatus("PREPARING", "READY")).toBe(true);
    expect(canTransitionOrderStatus("READY", "COMPLETED")).toBe(true);
  });

  it("allows cancellation before completion only", () => {
    expect(canTransitionOrderStatus("READY", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("COMPLETED", "CANCELLED")).toBe(false);
  });
});
