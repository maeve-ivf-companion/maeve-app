"use client";

import { forwardRef, useState } from "react";

type Variant = "primary" | "secondary" | "ghost" | "soft" | "outline" | "outlineLight";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-berry-500 text-white hover:bg-berry-600 shadow-sm shadow-berry-500/20",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  ghost: "bg-transparent text-white hover:bg-white/10",
  soft: "bg-blush-100 text-berry-600 hover:bg-blush-50",
  outline:
    "border border-white/30 bg-transparent text-white hover:bg-white/10 active:bg-white/15",
  outlineLight:
    "border border-white/30 bg-transparent text-white hover:bg-white/10 active:bg-white/15",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-berry-400 focus-visible:ring-offset-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});

export function Card({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white/[0.06] p-6 shadow-lg shadow-black/10 ${className}`}
      {...props}
    />
  );
}

export function Label({
  className = "",
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-sm font-medium text-white ${className}`}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-xl border border-line bg-white/[0.06] px-4 py-2.5 text-ink placeholder:text-faint transition focus:border-berry-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-berry-400/30";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={`${fieldBase} ${className}`} {...props} />;
});

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="m3 3 18 18" />}
    </svg>
  );
}

/**
 * Password field with a show/hide toggle, so people can catch their own typos.
 * Labels are passed in rather than hardcoded, because every string in this app
 * has to be available in both EN and FR.
 */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
    showLabel: string;
    hideLabel: string;
  }
>(function PasswordInput(
  { className = "", showLabel, hideLabel, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={`${fieldBase} pr-12 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        title={visible ? hideLabel : showLabel}
        className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 text-faint transition hover:text-berry-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-berry-400/50"
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${fieldBase} min-h-[120px] resize-y ${className}`}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = "", children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`${fieldBase} [&>option]:bg-plum-700 [&>option]:text-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

export function Badge({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-medium text-berry-600 ${className}`}
      {...props}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-t-2xl border border-line bg-plum-700 p-6 shadow-2xl shadow-black/40 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-lg text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
