import { describe, expect, it } from "vitest";
import { resolveSplit, splitEqual } from "../domain/splits";

describe("split engine", () => {
  it("splits equally with deterministic cent remainder", () => {
    expect(splitEqual(100, ["a", "b", "c"])).toEqual([
      { memberId: "a", amountCents: 34 },
      { memberId: "b", amountCents: 33 },
      { memberId: "c", amountCents: 33 },
    ]);
  });

  it("accepts exact amount splits only when they sum to the total", () => {
    expect(resolveSplit(10001, {
      method: "exact",
      shares: [
        { memberId: "ana", amountCents: 6000 },
        { memberId: "luis", amountCents: 4001 },
      ],
    })).toEqual({
      ok: true,
      shares: [
        { memberId: "ana", amountCents: 6000, method: "exact" },
        { memberId: "luis", amountCents: 4001, method: "exact" },
      ],
    });

    expect(resolveSplit(10000, {
      method: "exact",
      shares: [
        { memberId: "ana", amountCents: 6000 },
        { memberId: "luis", amountCents: 3000 },
      ],
    })).toMatchObject({ ok: false });
  });

  it("splits by share units with deterministic cent rounding", () => {
    expect(resolveSplit(100, {
      method: "shares",
      shares: [
        { memberId: "ana", units: 2 },
        { memberId: "luis", units: 1 },
        { memberId: "maru", units: 1 },
      ],
    })).toEqual({
      ok: true,
      shares: [
        { memberId: "ana", amountCents: 50, method: "shares", units: 2 },
        { memberId: "luis", amountCents: 25, method: "shares", units: 1 },
        { memberId: "maru", amountCents: 25, method: "shares", units: 1 },
      ],
    });
  });

  it("rejects duplicate participants and invalid share units", () => {
    expect(resolveSplit(100, {
      method: "shares",
      shares: [
        { memberId: "ana", units: 1 },
        { memberId: "ana", units: 1 },
      ],
    })).toMatchObject({ ok: false });

    expect(resolveSplit(100, {
      method: "shares",
      shares: [{ memberId: "ana", units: 0 }],
    })).toMatchObject({ ok: false });
  });
});
