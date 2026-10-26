"use client";

import { useState, useTransition } from "react";
import { Settings, Globe, CreditCard, Bell, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { updateProfile } from "@/app/actions/crud";
import { useT } from "@/i18n/client";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

interface SettingsManagerProps {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    company: string | null;
    phone: string | null;
    country: string | null;
    avatarUrl: string | null;
  };
}

export function SettingsManager({ profile }: SettingsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const t = useT();
  const S = t.admin.settings;
  const [notifications, setNotifications] = useState({
    newOrders: true,
    quoteRequests: true,
    lowStock: true,
    shipmentUpdates: true,
    customerRegistrations: false,
  });

  function handleSaveProfile(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfile({
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        company: formData.get("company") as string,
        phone: formData.get("phone") as string,
        country: formData.get("country") as string,
      });
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || t.admin.common.failed);
      }
    });
  }

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">{S.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {S.lead}
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-[var(--radius-sm)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success flex items-center gap-2">
          <Check className="h-4 w-4" />
          {S.saved}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">{S.profile}</h3>
          </div>
          <form action={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.firstName}</label>
                <input
                  type="text"
                  name="firstName"
                  defaultValue={profile.firstName}
                  required
                  className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.lastName}</label>
                <input
                  type="text"
                  name="lastName"
                  defaultValue={profile.lastName}
                  required
                  className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.email}</label>
              <input
                type="email"
                defaultValue={profile.email}
                disabled
                className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface-secondary px-4 text-sm text-text-secondary"
              />
              <p className="text-xs text-text-disabled mt-1">{S.emailHint}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.company}</label>
              <input
                type="text"
                name="company"
                defaultValue={profile.company || ""}
                className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.phone}</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={profile.phone || ""}
                  className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.country}</label>
                <input
                  type="text"
                  name="country"
                  defaultValue={profile.country || ""}
                  className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex h-10 items-center rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
              >
                {isPending ? t.admin.common.saving : S.save}
              </button>
            </div>
          </form>
        </Card>

        {/* Regional Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">{S.regional}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-medium text-text-secondary mb-1.5">{S.language}</span>
              <LanguageSwitcher align="left" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.timezone}</label>
              <select className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer">
                <option>Africa/Douala (GMT+1)</option>
                <option>Africa/Lagos (GMT+1)</option>
                <option>Africa/Nairobi (GMT+3)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.sourcingRegion}</label>
              <input type="text" defaultValue={S.sourcingRegionValue} className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none" />
            </div>
          </div>
        </Card>

        {/* Payment Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">{S.payment}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.methods}</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(S.methodNames).map((m) => (
                  <span key={m} className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-primary">{m}</span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">{S.terms}</label>
              <select className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer">
                <option>{S.termOptions.split}</option>
                <option>{S.termOptions.upfront}</option>
                <option>{S.termOptions.delivery}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-brand" />
            <h3 className="text-sm font-semibold text-navy">{S.notifications}</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "newOrders" as const, label: S.toggles.newOrders },
              { key: "quoteRequests" as const, label: S.toggles.quoteRequests },
              { key: "lowStock" as const, label: S.toggles.lowStock },
              { key: "shipmentUpdates" as const, label: S.toggles.shipmentUpdates },
              { key: "customerRegistrations" as const, label: S.toggles.customerRegistrations },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{item.label}</span>
                <button
                  onClick={() => toggleNotification(item.key)}
                  role="switch"
                  aria-checked={notifications[item.key]}
                  aria-label={item.label}
                  className={`relative h-6 w-11 rounded-full transition-colors ${notifications[item.key] ? "bg-brand" : "bg-surface-secondary"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key] ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}