"use client";

/**
 * Reusable text input for auth forms (signup/login).
 * Matches the af.games visual language — flat dark surface, soft border,
 * pink focus ring.
 */

import { ChangeEvent } from "react";

interface AuthInputProps {
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

export function AuthInput({
  label, type = "text", value, onChange, placeholder, autoComplete,
}: AuthInputProps) {
  return (
    <label className="block">
      <p className="af-eyebrow mb-2">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-[15px] text-white outline-none transition focus:border-[color:var(--af-pink)]"
      />
    </label>
  );
}
