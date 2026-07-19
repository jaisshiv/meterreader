"use client";

const SECRET_STORAGE_KEY = "private-party-secret";

export function generateSecret(): string {
  if (typeof window === "undefined") {
    return Math.random().toString(36).slice(2);
  }

  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateSecret(role: "organizer" | "guest"): string {
  if (typeof window === "undefined") {
    return `${role}-secret`;
  }

  const key = `${SECRET_STORAGE_KEY}:${role}`;
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const secret = generateSecret();
  window.localStorage.setItem(key, secret);
  return secret;
}
