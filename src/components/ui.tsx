"use client";

import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "soft" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-berry-500 text-white hover:bg-berry-600 shadow-sm shadow-berry-500/20",
  secondary:
    "bg-plum-700 text-white hover:bg-plum-600 shadow-sm shadow-plum-700/20",
  ghost: "bg-transparent text-plum-700 hover:bg-plum-50",
  soft: "bg-blush-100 text-berry-600 hover:bg-blush-50",
  outline:
    "border border-plum-200 bg-white text-plum-700 hover:border-berry-400 hover:bg-blush-50 active:bg-blush-100 shadow-sm shadow-plum-900/[0.04]",
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
      className={`rounded-2xl border border-line bg-white p-6 shadow-sm shadow-plum-900/[0.03] ${className}`}
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
      className={`mb-1.5 block text-sm font-medium text-plum-700 ${className}`}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-xl border border-line bg-cream/60 px-4 py-2.5 text-ink placeholder:text-faint transition focus:border-berry-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-berry-400/30";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={`${fieldBase} ${className}`} {...props} />;
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
    <select ref={ref} className={`${fieldBase} ${className}`} {...props}>
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
