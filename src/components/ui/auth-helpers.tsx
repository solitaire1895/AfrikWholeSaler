import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Checkbox ---
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  id?: string;
}

export function Checkbox({ checked, onChange, label, id }: CheckboxProps) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-all",
          checked
            ? "bg-brand border-brand"
            : "bg-surface border-border hover:border-brand/50"
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </button>
      <label
        htmlFor={id}
        className="text-sm text-text-secondary cursor-pointer select-none"
        onClick={() => onChange(!checked)}
      >
        {label}
      </label>
    </div>
  );
}

// --- Divider ---
export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-medium text-text-disabled uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// --- SocialButton ---
interface SocialButtonProps {
  provider: "google" | "apple";
  onClick?: () => void;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function SocialButton({ provider, onClick }: SocialButtonProps) {
  const isGoogle = provider === "google";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-button)] border border-border bg-surface text-sm font-semibold text-text-primary hover:bg-surface-secondary hover:border-brand/20 transition-all"
    >
      {isGoogle ? (
        <GoogleIcon className="h-5 w-5" />
      ) : (
        <AppleIcon className="h-5 w-5" />
      )}
      {isGoogle ? "Google" : "Apple"}
    </button>
  );
}

// --- PasswordStrength ---
export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = checks.filter((c) => c.met).length;
  const strength = metCount === 0 ? 0 : Math.round((metCount / 4) * 100);
  const strengthColor =
    strength <= 25
      ? "bg-error"
      : strength <= 50
        ? "bg-warning"
        : strength <= 75
          ? "bg-info"
          : "bg-success";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < metCount ? strengthColor : "bg-border"
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((check) => (
          <span
            key={check.label}
            className={cn(
              "text-xs flex items-center gap-1",
              check.met ? "text-success" : "text-text-disabled"
            )}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}