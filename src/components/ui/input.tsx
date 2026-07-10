import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-12 rounded-[var(--radius-input)] border bg-surface px-4 text-sm text-text-primary placeholder:text-text-disabled transition-all focus:outline-none focus:ring-2",
              icon && "pl-11",
              error
                ? "border-error focus:border-error focus:ring-error/20"
                : "border-border focus:border-brand focus:ring-brand/20",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-error font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";