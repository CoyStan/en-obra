import { describe, expect, it } from "vitest";
import {
  formatPhoneDisplay,
  isValidPhoneForWhatsApp,
  normalizePhoneToE164,
  toWaMeDigits,
} from "../en-obra/phone";

describe("phone normalization", () => {
  it("normalizes Mexico 10-digit numbers to E.164", () => {
    expect(normalizePhoneToE164("5511223344")).toBe("+525511223344");
    expect(normalizePhoneToE164("55 1234 5678")).toBe("+525512345678");
  });

  it("keeps existing +52 numbers", () => {
    expect(normalizePhoneToE164("+525511223344")).toBe("+525511223344");
    expect(normalizePhoneToE164("+52 55 1234 5678")).toBe("+525512345678");
  });

  it("allows other international numbers such as Colombia +57", () => {
    expect(normalizePhoneToE164("+573001234567")).toBe("+573001234567");
    expect(normalizePhoneToE164("+57 300 123 4567")).toBe("+573001234567");
  });

  it("returns empty for empty input", () => {
    expect(normalizePhoneToE164("")).toBe("");
    expect(normalizePhoneToE164("   ")).toBe("");
    expect(formatPhoneDisplay("")).toBe("");
    expect(isValidPhoneForWhatsApp("")).toBe(false);
    expect(toWaMeDigits("")).toBe("");
  });

  it("rejects short or malformed numbers", () => {
    expect(normalizePhoneToE164("12345")).toBe("");
    expect(normalizePhoneToE164("abc")).toBe("");
    expect(isValidPhoneForWhatsApp("+52123")).toBe(false);
  });

  it("formats display and WhatsApp digits from E.164", () => {
    expect(formatPhoneDisplay("+525511223344")).toBe("+52 55 1122 3344");
    expect(formatPhoneDisplay("+573001234567")).toBe("+57 300 123 4567");
    expect(toWaMeDigits("+525511223344")).toBe("525511223344");
    expect(isValidPhoneForWhatsApp("+525511223344")).toBe(true);
  });
});
