"use client";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Toggle({ checked, onChange, disabled, size = "md" }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
        size === "sm" ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-success" : "bg-white/20",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200",
        size === "sm" ? "h-4 w-4" : "h-5 w-5",
        checked
          ? size === "sm" ? "translate-x-4" : "translate-x-5"
          : "translate-x-0"
      )} />
    </button>
  );
}
