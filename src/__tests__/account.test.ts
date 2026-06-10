import { describe, expect, it } from "vitest";
import { validateAccountInput } from "../auth/accountValidation";

describe("account validation", () => {
  it("normalizes a valid mock account", () => {
    const result = validateAccountInput({
      displayName: " Ana ",
      email: "ANA@Example.COM ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        displayName: "Ana",
        email: "ana@example.com",
      },
    });
  });

  it("rejects short names and invalid emails", () => {
    expect(validateAccountInput({ displayName: "A", email: "ana@example.com" }).ok).toBe(false);
    expect(validateAccountInput({ displayName: "Ana", email: "ana" }).ok).toBe(false);
  });
});
