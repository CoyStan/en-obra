import type { CreateAccountInput } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAccountInput(input: CreateAccountInput) {
  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();

  if (displayName.length < 2) {
    return { ok: false as const, error: "Escribe un nombre de al menos 2 letras." };
  }
  if (!emailPattern.test(email)) {
    return { ok: false as const, error: "Usa un correo valido para el demo." };
  }

  return {
    ok: true as const,
    value: {
      displayName,
      email,
    },
  };
}
